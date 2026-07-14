package com.web.app.test;

import com.web.app.domain.UD18Request;
import com.web.app.mapper.UD18Mapper;
import com.web.app.service.impl.UD18ServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD18ServiceImpl 单元测试
 * processUserDoc: switch 4种operation + 循环doctypes
 */
class UD18ServiceImplTest {

    @Mock
    private UD18Mapper ud18Mapper;

    @InjectMocks
    private UD18ServiceImpl ud18Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("checkAuth 操作测试")
    class CheckAuthTest {

        @Test
        @DisplayName("checkAuth - 用户存在功能权限")
        void testCheckAuthExists() {
            UD18Request request = new UD18Request();
            request.setUserid("USER001");
            request.setOperation("checkAuth");

            when(ud18Mapper.selectFunctionAuth("USER001")).thenReturn(Arrays.asList("FUNC1", "FUNC2"));

            Map<String, Object> result = ud18Service.processUserDoc(request);

            assertAll(
                    () -> assertTrue((Boolean) result.get("exists")),
                    () -> assertEquals(2, ((List<String>) result.get("functions")).size())
            );
        }

        @Test
        @DisplayName("checkAuth - 用户无功能权限")
        void testCheckAuthNotExists() {
            UD18Request request = new UD18Request();
            request.setUserid("USER001");
            request.setOperation("checkAuth");

            when(ud18Mapper.selectFunctionAuth("USER001")).thenReturn(Collections.emptyList());

            Map<String, Object> result = ud18Service.processUserDoc(request);

            assertAll(
                    () -> assertFalse((Boolean) result.get("exists")),
                    () -> assertEquals("User not found", result.get("message"))
            );
        }

        @Test
        @DisplayName("checkAuth - functions为null时视为不存在")
        void testCheckAuthNullFunctions() {
            UD18Request request = new UD18Request();
            request.setUserid("USER001");
            request.setOperation("checkAuth");

            when(ud18Mapper.selectFunctionAuth("USER001")).thenReturn(null);

            Map<String, Object> result = ud18Service.processUserDoc(request);

            assertFalse((Boolean) result.get("exists"));
        }
    }

    @Nested
    @DisplayName("select 操作测试")
    class SelectTest {

        @Test
        @DisplayName("select - 返回用户名和文档类型列表")
        void testSelectWithData() {
            UD18Request request = new UD18Request();
            request.setUserid("USER001");
            request.setOperation("select");

            when(ud18Mapper.selectUsername("USER001")).thenReturn("John");
            when(ud18Mapper.selectUserDoc("USER001")).thenReturn(Arrays.asList("DOCTYPE1", "DOCTYPE2"));

            Map<String, Object> result = ud18Service.processUserDoc(request);

            assertAll(
                    () -> assertEquals("John", result.get("username")),
                    () -> assertEquals(2, ((List<String>) result.get("doctypes")).size())
            );
        }

        @Test
        @DisplayName("select - username为null时返回空字符串")
        void testSelectNullUsername() {
            UD18Request request = new UD18Request();
            request.setUserid("NONEXIST");
            request.setOperation("select");

            when(ud18Mapper.selectUsername("NONEXIST")).thenReturn(null);
            when(ud18Mapper.selectUserDoc("NONEXIST")).thenReturn(null);

            Map<String, Object> result = ud18Service.processUserDoc(request);

            assertAll(
                    () -> assertEquals("", result.get("username")),
                    () -> assertTrue(((List<String>) result.get("doctypes")).isEmpty())
            );
        }

        @Test
        @DisplayName("select - doctypes为null时返回空列表")
        void testSelectNullDoctypes() {
            UD18Request request = new UD18Request();
            request.setUserid("USER001");
            request.setOperation("select");

            when(ud18Mapper.selectUsername("USER001")).thenReturn("John");
            when(ud18Mapper.selectUserDoc("USER001")).thenReturn(null);

            Map<String, Object> result = ud18Service.processUserDoc(request);

            assertTrue(((List<String>) result.get("doctypes")).isEmpty());
        }
    }

    @Nested
    @DisplayName("delete 操作测试")
    class DeleteTest {

        @Test
        @DisplayName("delete - 删除成功")
        void testDelete() {
            UD18Request request = new UD18Request();
            request.setUserid("USER001");
            request.setOperation("delete");

            Map<String, Object> result = ud18Service.processUserDoc(request);

            assertAll(
                    () -> assertTrue((Boolean) result.get("success")),
                    () -> assertEquals("Document permissions deleted successfully.", result.get("message"))
            );
            verify(ud18Mapper, times(1)).deleteUserDoc("USER001");
        }
    }

    @Nested
    @DisplayName("create 操作测试")
    class CreateTest {

        @Test
        @DisplayName("create - 先删后增多个文档类型")
        void testCreateWithDoctypes() {
            UD18Request request = new UD18Request();
            request.setUserid("USER001");
            request.setOperation("create");
            request.setDoctypes(Arrays.asList("DOCTYPE1", "DOCTYPE2", "DOCTYPE3"));

            Map<String, Object> result = ud18Service.processUserDoc(request);

            assertAll(
                    () -> assertTrue((Boolean) result.get("success")),
                    () -> assertEquals("Document permissions created successfully.", result.get("message"))
            );
            verify(ud18Mapper, times(1)).deleteUserDoc("USER001");
            verify(ud18Mapper, times(3)).insertUserDoc(eq("USER001"), anyString());
            verify(ud18Mapper, times(1)).insertUserDoc("USER001", "DOCTYPE1");
            verify(ud18Mapper, times(1)).insertUserDoc("USER001", "DOCTYPE2");
            verify(ud18Mapper, times(1)).insertUserDoc("USER001", "DOCTYPE3");
        }

        @Test
        @DisplayName("create - doctypes为null时只删除不添加")
        void testCreateWithNullDoctypes() {
            UD18Request request = new UD18Request();
            request.setUserid("USER001");
            request.setOperation("create");
            request.setDoctypes(null);

            Map<String, Object> result = ud18Service.processUserDoc(request);

            assertTrue((Boolean) result.get("success"));
            verify(ud18Mapper, times(1)).deleteUserDoc("USER001");
            verify(ud18Mapper, never()).insertUserDoc(anyString(), anyString());
        }

        @Test
        @DisplayName("create - 空文档类型列表只删除不添加")
        void testCreateWithEmptyDoctypes() {
            UD18Request request = new UD18Request();
            request.setUserid("USER001");
            request.setOperation("create");
            request.setDoctypes(Collections.emptyList());

            Map<String, Object> result = ud18Service.processUserDoc(request);

            assertTrue((Boolean) result.get("success"));
            verify(ud18Mapper, times(1)).deleteUserDoc("USER001");
            verify(ud18Mapper, never()).insertUserDoc(anyString(), anyString());
        }
    }

    @Nested
    @DisplayName("未知操作测试")
    class UnknownOperationTest {

        @Test
        @DisplayName("未知操作抛出异常")
        void testUnknownOperation() {
            UD18Request request = new UD18Request();
            request.setUserid("USER001");
            request.setOperation("unknown");

            assertThrows(IllegalArgumentException.class,
                    () -> ud18Service.processUserDoc(request));
        }
    }
}
