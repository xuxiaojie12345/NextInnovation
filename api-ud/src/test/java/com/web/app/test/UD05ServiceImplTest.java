package com.web.app.test;

import com.web.app.domain.ModifyDocumentQueryResponse;
import com.web.app.domain.ModifyDocumentQueryResponse.VariableInfo;
import com.web.app.mapper.UD05Mapper;
import com.web.app.service.impl.UD05ServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD05ServiceImpl 单元测试
 * selectVariableModification: try/catch rethrow
 * updateHdocAdcaModification: rows>0检查 + try/catch
 */
class UD05ServiceImplTest {

    @Mock
    private UD05Mapper ud05Mapper;

    @InjectMocks
    private UD05ServiceImpl ud05Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("selectVariableModification() 方法测试")
    class SelectVariableModificationTest {

        @Test
        @DisplayName("正常查询返回变量列表 - 多条记录")
        void testSelectVariableModificationSuccess() {
            VariableInfo vi1 = new VariableInfo();
            vi1.setVariable("VAR1");
            vi1.setDescription("Desc1");
            vi1.setCurrentValue("Val1");
            vi1.setModifiedValue("NewVal1");

            VariableInfo vi2 = new VariableInfo();
            vi2.setVariable("VAR2");
            vi2.setDescription("Desc2");

            List<VariableInfo> variableList = Arrays.asList(vi1, vi2);
            when(ud05Mapper.selectVariableModification("SERIE1", "CHNO1")).thenReturn(variableList);

            ModifyDocumentQueryResponse result = ud05Service.selectVariableModification("SERIE1", "CHNO1");

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertEquals("CHNO1", result.getChassisNo()),
                    () -> assertEquals(2, result.getVariables().size()),
                    () -> assertEquals("aus/UD_TEST.odt", result.getTemplateFile()),
                    () -> assertEquals("VAR1", result.getVariables().get(0).getVariable()),
                    () -> assertEquals("VAR2", result.getVariables().get(1).getVariable())
            );
            verify(ud05Mapper, times(1)).selectVariableModification("SERIE1", "CHNO1");
        }

        @Test
        @DisplayName("查询返回空变量列表")
        void testSelectVariableModificationEmptyList() {
            when(ud05Mapper.selectVariableModification("SERIE1", "CHNO1"))
                    .thenReturn(Collections.emptyList());

            ModifyDocumentQueryResponse result = ud05Service.selectVariableModification("SERIE1", "CHNO1");

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertTrue(result.getVariables().isEmpty())
            );
        }

        @Test
        @DisplayName("Mapper抛出异常时重新抛出")
        void testSelectVariableModificationException() {
            when(ud05Mapper.selectVariableModification(anyString(), anyString()))
                    .thenThrow(new RuntimeException("DB error"));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> ud05Service.selectVariableModification("SERIE1", "CHNO1"));

            assertEquals("DB error", exception.getMessage());
        }
    }

    @Nested
    @DisplayName("updateHdocAdcaModification() 方法测试")
    class UpdateHdocAdcaModificationTest {

        @Test
        @DisplayName("更新成功 - rows>0 返回true")
        void testUpdateSuccessReturnsTrue() {
            when(ud05Mapper.updateHdocAdcaModification("SERIE1", "CHNO1", "VAR1", "NEWVAL", "USER1"))
                    .thenReturn(1);

            boolean result = ud05Service.updateHdocAdcaModification("SERIE1", "CHNO1", "VAR1", "NEWVAL", "USER1");

            assertTrue(result);
            verify(ud05Mapper, times(1))
                    .updateHdocAdcaModification("SERIE1", "CHNO1", "VAR1", "NEWVAL", "USER1");
        }

        @Test
        @DisplayName("更新无记录 - rows==0 返回false")
        void testUpdateNoRecordReturnsFalse() {
            when(ud05Mapper.updateHdocAdcaModification("SERIE1", "CHNO1", "VAR1", "NEWVAL", "USER1"))
                    .thenReturn(0);

            boolean result = ud05Service.updateHdocAdcaModification("SERIE1", "CHNO1", "VAR1", "NEWVAL", "USER1");

            assertFalse(result);
        }

        @Test
        @DisplayName("更新操作抛出异常时重新抛出")
        void testUpdateException() {
            when(ud05Mapper.updateHdocAdcaModification(anyString(), anyString(), anyString(), anyString(), anyString()))
                    .thenThrow(new RuntimeException("DB error"));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> ud05Service.updateHdocAdcaModification("SERIE1", "CHNO1", "VAR1", "NEWVAL", "USER1"));

            assertEquals("DB error", exception.getMessage());
        }

        @Test
        @DisplayName("更新时参数含null值")
        void testUpdateWithNullParams() {
            when(ud05Mapper.updateHdocAdcaModification(null, null, null, null, null))
                    .thenReturn(0);

            boolean result = ud05Service.updateHdocAdcaModification(null, null, null, null, null);

            assertFalse(result);
            verify(ud05Mapper, times(1))
                    .updateHdocAdcaModification(null, null, null, null, null);
        }
    }
}
