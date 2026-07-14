package com.web.app.test;

import com.web.app.domain.UD10SearchRequest;
import com.web.app.domain.entity.HdocVariable;
import com.web.app.mapper.UD10Mapper;
import com.web.app.service.impl.UD10ServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD10ServiceImpl 单元测试
 * search / selectByVariable / add / update / delete
 * 分支: count>0校验, existing==null检查, 日期解析try/catch
 */
class UD10ServiceImplTest {

    @Mock
    private UD10Mapper ud10Mapper;

    @InjectMocks
    private UD10ServiceImpl ud10Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("search() 方法测试")
    class SearchTest {

        @Test
        @DisplayName("正常搜索返回列表")
        void testSearchReturnsList() {
            UD10SearchRequest request = new UD10SearchRequest();
            HdocVariable hv = new HdocVariable();
            hv.setVariable("VAR1");
            when(ud10Mapper.searchHdocVariables(request)).thenReturn(Collections.singletonList(hv));

            List<HdocVariable> result = ud10Service.search(request);

            assertEquals(1, result.size());
            assertEquals("VAR1", result.get(0).getVariable());
        }

        @Test
        @DisplayName("搜索返回空列表")
        void testSearchReturnsEmptyList() {
            UD10SearchRequest request = new UD10SearchRequest();
            when(ud10Mapper.searchHdocVariables(request)).thenReturn(Collections.emptyList());

            List<HdocVariable> result = ud10Service.search(request);

            assertTrue(result.isEmpty());
        }
    }

    @Nested
    @DisplayName("selectByVariable() 方法测试")
    class SelectByVariableTest {

        @Test
        @DisplayName("查询存在记录返回实体")
        void testSelectByVariableFound() {
            HdocVariable hv = new HdocVariable();
            hv.setVariable("VAR1");
            hv.setType("STRING");
            when(ud10Mapper.selectByVariable("VAR1")).thenReturn(hv);

            HdocVariable result = ud10Service.selectByVariable("VAR1");

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertEquals("VAR1", result.getVariable()),
                    () -> assertEquals("STRING", result.getType())
            );
        }

        @Test
        @DisplayName("查询不存在记录返回null")
        void testSelectByVariableNotFound() {
            when(ud10Mapper.selectByVariable("NONEXIST")).thenReturn(null);

            HdocVariable result = ud10Service.selectByVariable("NONEXIST");

            assertNull(result);
        }
    }

    @Nested
    @DisplayName("add() 方法测试")
    class AddTest {

        @Test
        @DisplayName("添加成功 - Variable不存在 - 返回null")
        void testAddSuccess() {
            when(ud10Mapper.countByVariable("NEW_VAR")).thenReturn(0);

            String result = ud10Service.add("NEW_VAR", "STRING", "Desc", "USER1", "2024-01-15 10:00:00");

            assertNull(result);
            verify(ud10Mapper, times(1)).insert(any(HdocVariable.class));
        }

        @Test
        @DisplayName("添加失败 - Variable已存在 - 返回错误消息")
        void testAddDuplicateKey() {
            when(ud10Mapper.countByVariable("EXIST_VAR")).thenReturn(1);

            String result = ud10Service.add("EXIST_VAR", "STRING", "Desc", "USER1", null);

            assertEquals("Variant already exists. Please enter the correct content", result);
            verify(ud10Mapper, never()).insert(any(HdocVariable.class));
        }

        @Test
        @DisplayName("添加时registerDatetime为空使用当前时间")
        void testAddWithNullDatetime() {
            when(ud10Mapper.countByVariable("NEW_VAR")).thenReturn(0);

            String result = ud10Service.add("NEW_VAR", "STRING", "Desc", "USER1", null);

            assertNull(result);
            verify(ud10Mapper, times(1)).insert(any(HdocVariable.class));
        }

        @Test
        @DisplayName("添加时registerDatetime为空串使用当前时间")
        void testAddWithEmptyDatetime() {
            when(ud10Mapper.countByVariable("NEW_VAR")).thenReturn(0);

            String result = ud10Service.add("NEW_VAR", "STRING", "Desc", "USER1", "");

            assertNull(result);
            verify(ud10Mapper, times(1)).insert(any(HdocVariable.class));
        }

        @Test
        @DisplayName("添加时registerDatetime无效格式使用当前时间")
        void testAddWithInvalidDatetime() {
            when(ud10Mapper.countByVariable("NEW_VAR")).thenReturn(0);

            String result = ud10Service.add("NEW_VAR", "STRING", "Desc", "USER1", "invalid-date");

            assertNull(result);
            verify(ud10Mapper, times(1)).insert(any(HdocVariable.class));
        }

        @Test
        @DisplayName("添加时userid为null使用SYSTEM")
        void testAddWithNullUserid() {
            when(ud10Mapper.countByVariable("NEW_VAR")).thenReturn(0);

            String result = ud10Service.add("NEW_VAR", "STRING", "Desc", null, null);

            assertNull(result);
            verify(ud10Mapper, times(1)).insert(argThat(record ->
                    "SYSTEM".equals(record.getRegisterUser()) &&
                    "SYSTEM".equals(record.getUpdateUser())
            ));
        }
    }

    @Nested
    @DisplayName("update() 方法测试")
    class UpdateTest {

        @Test
        @DisplayName("更新成功 - 记录存在 - 返回null")
        void testUpdateSuccess() {
            HdocVariable existing = new HdocVariable();
            existing.setVariable("EXIST_VAR");
            existing.setType("STRING");
            existing.setRegisterDatetime(LocalDateTime.of(2024, 1, 1, 0, 0));
            existing.setRegisterUser("OLD_USER");
            when(ud10Mapper.selectByVariable("EXIST_VAR")).thenReturn(existing);

            String result = ud10Service.update("EXIST_VAR", "NUMBER", "New Desc", "USER1", "2024-06-15 10:00:00");

            assertNull(result);
            verify(ud10Mapper, times(1)).updateByVariable(any(HdocVariable.class));
        }

        @Test
        @DisplayName("更新失败 - 记录不存在 - 返回错误消息")
        void testUpdateNotFound() {
            when(ud10Mapper.selectByVariable("NONEXIST")).thenReturn(null);

            String result = ud10Service.update("NONEXIST", "STRING", "Desc", "USER1", null);

            assertEquals("Variant does not exists. Please enter the correct content", result);
            verify(ud10Mapper, never()).updateByVariable(any(HdocVariable.class));
        }

        @Test
        @DisplayName("更新时registerDatetime为空使用existing的日期")
        void testUpdateWithNullDatetime() {
            HdocVariable existing = new HdocVariable();
            existing.setVariable("EXIST_VAR");
            existing.setRegisterDatetime(LocalDateTime.of(2024, 1, 1, 0, 0));
            existing.setRegisterUser("OLD_USER");
            when(ud10Mapper.selectByVariable("EXIST_VAR")).thenReturn(existing);

            String result = ud10Service.update("EXIST_VAR", "NUMBER", "Desc", "USER1", null);

            assertNull(result);
            verify(ud10Mapper, times(1)).updateByVariable(any(HdocVariable.class));
        }

        @Test
        @DisplayName("更新时registerDatetime为空串使用existing的日期")
        void testUpdateWithEmptyDatetime() {
            HdocVariable existing = new HdocVariable();
            existing.setVariable("EXIST_VAR");
            existing.setRegisterDatetime(LocalDateTime.of(2024, 1, 1, 0, 0));
            existing.setRegisterUser("OLD_USER");
            when(ud10Mapper.selectByVariable("EXIST_VAR")).thenReturn(existing);

            String result = ud10Service.update("EXIST_VAR", "NUMBER", "Desc", "USER1", "");

            assertNull(result);
            verify(ud10Mapper, times(1)).updateByVariable(any(HdocVariable.class));
        }

        @Test
        @DisplayName("更新时registerDatetime无效格式使用existing的日期")
        void testUpdateWithInvalidDatetime() {
            HdocVariable existing = new HdocVariable();
            existing.setVariable("EXIST_VAR");
            existing.setRegisterDatetime(LocalDateTime.of(2024, 1, 1, 0, 0));
            existing.setRegisterUser("OLD_USER");
            when(ud10Mapper.selectByVariable("EXIST_VAR")).thenReturn(existing);

            String result = ud10Service.update("EXIST_VAR", "NUMBER", "Desc", "USER1", "bad-date");

            assertNull(result);
            verify(ud10Mapper, times(1)).updateByVariable(any(HdocVariable.class));
        }

        @Test
        @DisplayName("更新时userid为null使用SYSTEM")
        void testUpdateWithNullUpdateUser() {
            HdocVariable existing = new HdocVariable();
            existing.setVariable("EXIST_VAR");
            existing.setRegisterDatetime(LocalDateTime.of(2024, 1, 1, 0, 0));
            existing.setRegisterUser("OLD_USER");
            when(ud10Mapper.selectByVariable("EXIST_VAR")).thenReturn(existing);

            String result = ud10Service.update("EXIST_VAR", "NUMBER", "Desc", null, null);

            assertNull(result);
            verify(ud10Mapper, times(1)).updateByVariable(argThat(record ->
                    "SYSTEM".equals(record.getUpdateUser())
            ));
        }
    }

    @Nested
    @DisplayName("delete() 方法测试")
    class DeleteTest {

        @Test
        @DisplayName("删除成功 - 记录存在 - 返回null")
        void testDeleteSuccess() {
            HdocVariable existing = new HdocVariable();
            existing.setVariable("EXIST_VAR");
            when(ud10Mapper.selectByVariable("EXIST_VAR")).thenReturn(existing);

            String result = ud10Service.delete("EXIST_VAR");

            assertNull(result);
            verify(ud10Mapper, times(1)).deleteByVariable("EXIST_VAR");
        }

        @Test
        @DisplayName("删除失败 - 记录不存在 - 返回错误消息")
        void testDeleteNotFound() {
            when(ud10Mapper.selectByVariable("NONEXIST")).thenReturn(null);

            String result = ud10Service.delete("NONEXIST");

            assertEquals("Variant does not exists. Please enter the correct content", result);
            verify(ud10Mapper, never()).deleteByVariable(anyString());
        }
    }
}
