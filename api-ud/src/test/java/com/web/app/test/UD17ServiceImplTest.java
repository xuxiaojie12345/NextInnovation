package com.web.app.test;

import com.web.app.domain.UD17Request;
import com.web.app.mapper.UD17Mapper;
import com.web.app.service.impl.UD17ServiceImpl;
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
 * UD17ServiceImpl 单元测试
 * getMarkets + processUserAdmin: switch 3种operation + 循环functions/markets
 */
class UD17ServiceImplTest {

    @Mock
    private UD17Mapper ud17Mapper;

    @InjectMocks
    private UD17ServiceImpl ud17Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("getMarkets() 方法测试")
    class GetMarketsTest {

        @Test
        @DisplayName("返回市场列表")
        void testGetMarkets() {
            Map<String, String> m1 = new LinkedHashMap<>();
            m1.put("market", "JPN");
            when(ud17Mapper.selectAllMarkets()).thenReturn(Collections.singletonList(m1));

            List<Map<String, String>> result = ud17Service.getMarkets();

            assertEquals(1, result.size());
            assertEquals("JPN", result.get(0).get("market"));
        }
    }

    @Nested
    @DisplayName("userinfo 操作测试")
    class UserInfoTest {

        @Test
        @DisplayName("userinfo - 返回完整用户信息")
        void testUserInfo() {
            UD17Request request = new UD17Request();
            request.setUserid("USER001");
            request.setOperation("userinfo");

            when(ud17Mapper.selectUsername("USER001")).thenReturn("John");
            when(ud17Mapper.selectFunctionAuth("USER001")).thenReturn(Collections.emptyList());
            when(ud17Mapper.selectMarketAuth("USER001")).thenReturn(Collections.emptyList());

            Map<String, Object> result = ud17Service.processUserAdmin(request);

            assertAll(
                    () -> assertEquals("John", result.get("username")),
                    () -> assertNotNull(result.get("functions")),
                    () -> assertNotNull(result.get("markets"))
            );
        }

        @Test
        @DisplayName("userinfo - username为null时返回空字符串")
        void testUserInfoNullUsername() {
            UD17Request request = new UD17Request();
            request.setUserid("NONEXIST");
            request.setOperation("userinfo");

            when(ud17Mapper.selectUsername("NONEXIST")).thenReturn(null);
            when(ud17Mapper.selectFunctionAuth("NONEXIST")).thenReturn(Collections.emptyList());
            when(ud17Mapper.selectMarketAuth("NONEXIST")).thenReturn(Collections.emptyList());

            Map<String, Object> result = ud17Service.processUserAdmin(request);

            assertEquals("", result.get("username"));
        }
    }

    @Nested
    @DisplayName("updateRole 操作测试")
    class UpdateRoleTest {

        @Test
        @DisplayName("updateRole - 用户存在且更新成功")
        void testUpdateRoleSuccess() {
            UD17Request request = new UD17Request();
            request.setUserid("USER001");
            request.setOperation("updateRole");
            request.setFunctions(Arrays.asList("FUNC1", "FUNC2"));
            List<Map<String, String>> markets = new ArrayList<>();
            Map<String, String> market1 = new LinkedHashMap<>();
            market1.put("market", "JPN");
            market1.put("type", "A");
            market1.put("bu", "BU1");
            markets.add(market1);
            request.setMarkets(markets);
            request.setUpdateUser("ADMIN");
            request.setUpdateProcess("PROC1");

            when(ud17Mapper.selectUsername("USER001")).thenReturn("John");

            Map<String, Object> result = ud17Service.processUserAdmin(request);

            assertAll(
                    () -> assertTrue((Boolean) result.get("success")),
                    () -> assertEquals("Role updated successfully.", result.get("message"))
            );
            verify(ud17Mapper, times(1)).deleteAllFunctionAuth("USER001");
            verify(ud17Mapper, times(1)).deleteAllMarketAuth("USER001");
            verify(ud17Mapper, times(2)).insertFunctionAuth(anyString(), eq("USER001"), eq("ADMIN"), eq("PROC1"));
            verify(ud17Mapper, times(1)).insertMarketAuth(eq("USER001"), eq("JPN"), eq("A"), eq("BU1"), eq("ADMIN"), eq("PROC1"));
        }

        @Test
        @DisplayName("updateRole - 用户不存在时返回失败消息")
        void testUpdateRoleUserNotFound() {
            UD17Request request = new UD17Request();
            request.setUserid("NONEXIST");
            request.setOperation("updateRole");

            when(ud17Mapper.selectUsername("NONEXIST")).thenReturn(null);

            Map<String, Object> result = ud17Service.processUserAdmin(request);

            assertAll(
                    () -> assertFalse((Boolean) result.get("success")),
                    () -> assertTrue(((String) result.get("message")).contains("didn't recognize"))
            );
            verify(ud17Mapper, never()).deleteAllFunctionAuth(anyString());
            verify(ud17Mapper, never()).deleteAllMarketAuth(anyString());
        }

        @Test
        @DisplayName("updateRole - functions和markets为null时跳过添加")
        void testUpdateRoleNullCollections() {
            UD17Request request = new UD17Request();
            request.setUserid("USER001");
            request.setOperation("updateRole");
            request.setFunctions(null);
            request.setMarkets(null);
            request.setUpdateUser("ADMIN");
            request.setUpdateProcess("PROC1");

            when(ud17Mapper.selectUsername("USER001")).thenReturn("John");

            Map<String, Object> result = ud17Service.processUserAdmin(request);

            assertTrue((Boolean) result.get("success"));
            verify(ud17Mapper, times(1)).deleteAllFunctionAuth("USER001");
            verify(ud17Mapper, times(1)).deleteAllMarketAuth("USER001");
            verify(ud17Mapper, never()).insertFunctionAuth(anyString(), anyString(), anyString(), anyString());
            verify(ud17Mapper, never()).insertMarketAuth(anyString(), anyString(), anyString(), anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("updateRole - 空集合时跳过添加")
        void testUpdateRoleEmptyCollections() {
            UD17Request request = new UD17Request();
            request.setUserid("USER001");
            request.setOperation("updateRole");
            request.setFunctions(Collections.emptyList());
            request.setMarkets(Collections.emptyList());
            request.setUpdateUser("ADMIN");
            request.setUpdateProcess("PROC1");

            when(ud17Mapper.selectUsername("USER001")).thenReturn("John");

            Map<String, Object> result = ud17Service.processUserAdmin(request);

            assertTrue((Boolean) result.get("success"));
            verify(ud17Mapper, never()).insertFunctionAuth(anyString(), anyString(), anyString(), anyString());
            verify(ud17Mapper, never()).insertMarketAuth(anyString(), anyString(), anyString(), anyString(), anyString(), anyString());
        }
    }

    @Nested
    @DisplayName("deleteRole 操作测试")
    class DeleteRoleTest {

        @Test
        @DisplayName("deleteRole - 删除成功")
        void testDeleteRole() {
            UD17Request request = new UD17Request();
            request.setUserid("USER001");
            request.setOperation("deleteRole");

            Map<String, Object> result = ud17Service.processUserAdmin(request);

            assertAll(
                    () -> assertTrue((Boolean) result.get("success")),
                    () -> assertEquals("Role deleted successfully.", result.get("message"))
            );
            verify(ud17Mapper, times(1)).deleteAllMarketAuth("USER001");
            verify(ud17Mapper, times(1)).deleteAllFunctionAuth("USER001");
        }
    }

    @Nested
    @DisplayName("未知操作测试")
    class UnknownOperationTest {

        @Test
        @DisplayName("未知操作抛出异常")
        void testUnknownOperation() {
            UD17Request request = new UD17Request();
            request.setUserid("USER001");
            request.setOperation("unknown");

            assertThrows(IllegalArgumentException.class,
                    () -> ud17Service.processUserAdmin(request));
        }
    }
}
