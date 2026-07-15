package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocVariables;
import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.service.impl.UD10HdocVariablesServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD10HdocVariablesServiceImpl 单元测试
 * 覆盖所有分支（100%覆盖率）
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD10HdocVariablesServiceImpl 单元测试")
class UD10HdocVariablesServiceImplTest {

    @Mock private HdocVariablesMapper mapper;
    @InjectMocks private UD10HdocVariablesServiceImpl service;

    private HdocVariables validReq;

    @BeforeEach
    void setUp() {
        reset(mapper);
        validReq = new HdocVariables();
        validReq.setVariable("TEST_VAR");
        validReq.setType("VDA");
        validReq.setDescription("Test Description");
        validReq.setCreatedByUser("test_user");
    }

    // ============================================================
    // addVariable
    // ============================================================
    @Test @DisplayName("add-variable为null-400")
    void testAdd_VariableNull() { validReq.setVariable(null); assertEquals(400, service.addVariable(validReq).getCode().intValue()); verifyNoInteractions(mapper); }

    @Test @DisplayName("add-variable为空-400")
    void testAdd_VariableEmpty() { validReq.setVariable(""); assertEquals(400, service.addVariable(validReq).getCode().intValue()); verifyNoInteractions(mapper); }

    @Test @DisplayName("add-variable超过20字符-400")
    void testAdd_VariableTooLong() { validReq.setVariable("A".repeat(21)); assertEquals(400, service.addVariable(validReq).getCode().intValue()); verifyNoInteractions(mapper); }

    @Test @DisplayName("add-type超过50字符-400")
    void testAdd_TypeTooLong() { validReq.setType("A".repeat(51)); assertEquals(400, service.addVariable(validReq).getCode().intValue()); verifyNoInteractions(mapper); }

    @Test @DisplayName("add-description超过200字符-400")
    void testAdd_DescriptionTooLong() { validReq.setDescription("A".repeat(201)); assertEquals(400, service.addVariable(validReq).getCode().intValue()); verifyNoInteractions(mapper); }

    @Test @DisplayName("add-变量已存在-400")
    void testAdd_AlreadyExists() {
        when(mapper.countByVariable("TEST_VAR")).thenReturn(1);
        assertEquals(400, service.addVariable(validReq).getCode().intValue());
        verify(mapper, never()).insert(any());
    }

    @Test @DisplayName("add-success-createdByUser有值")
    void testAdd_Success_WithUser() {
        when(mapper.countByVariable("TEST_VAR")).thenReturn(0);
        when(mapper.insert(any())).thenReturn(1);
        assertEquals(200, service.addVariable(validReq).getCode().intValue());
        verify(mapper, times(1)).insert(argThat(e -> "test_user".equals(e.getRegisterUser())));
    }

    @Test @DisplayName("add-success-createdByUser为null用SYSTEM")
    void testAdd_Success_UserNull() {
        validReq.setCreatedByUser(null);
        when(mapper.countByVariable("TEST_VAR")).thenReturn(0);
        when(mapper.insert(any())).thenReturn(1);
        assertEquals(200, service.addVariable(validReq).getCode().intValue());
        verify(mapper, times(1)).insert(argThat(e -> "SYSTEM".equals(e.getRegisterUser())));
    }

    @Test @DisplayName("add-success-createdByUser为空用SYSTEM")
    void testAdd_Success_UserEmpty() {
        validReq.setCreatedByUser("");
        when(mapper.countByVariable("TEST_VAR")).thenReturn(0);
        when(mapper.insert(any())).thenReturn(1);
        assertEquals(200, service.addVariable(validReq).getCode().intValue());
        verify(mapper, times(1)).insert(argThat(e -> "SYSTEM".equals(e.getRegisterUser())));
    }

    @Test @DisplayName("add-insert返回0-500")
    void testAdd_InsertFails() {
        when(mapper.countByVariable("TEST_VAR")).thenReturn(0);
        when(mapper.insert(any())).thenReturn(0);
        assertEquals(500, service.addVariable(validReq).getCode().intValue());
    }

    @Test @DisplayName("add-异常-500")
    void testAdd_Exception() {
        when(mapper.countByVariable("TEST_VAR")).thenThrow(new RuntimeException());
        assertEquals(500, service.addVariable(validReq).getCode().intValue());
    }

    // ============================================================
    // updateVariable
    // ============================================================
    @Test @DisplayName("update-variable为null-400") void testUpd_VarNull() { validReq.setVariable(null); assertEquals(400, service.updateVariable(validReq).getCode().intValue()); verifyNoInteractions(mapper); }
    @Test @DisplayName("update-variable为空-400") void testUpd_VarEmpty() { validReq.setVariable(""); assertEquals(400, service.updateVariable(validReq).getCode().intValue()); verifyNoInteractions(mapper); }
    @Test @DisplayName("update-variable超过20-400") void testUpd_VarTooLong() { validReq.setVariable("A".repeat(21)); assertEquals(400, service.updateVariable(validReq).getCode().intValue()); verifyNoInteractions(mapper); }
    @Test @DisplayName("update-type超过50-400") void testUpd_TypeTooLong() { validReq.setType("A".repeat(51)); assertEquals(400, service.updateVariable(validReq).getCode().intValue()); verifyNoInteractions(mapper); }
    @Test @DisplayName("update-description超过200-400") void testUpd_DescTooLong() { validReq.setDescription("A".repeat(201)); assertEquals(400, service.updateVariable(validReq).getCode().intValue()); verifyNoInteractions(mapper); }

    @Test @DisplayName("update-记录不存在-400")
    void testUpd_NotFound() {
        when(mapper.countByVariable("TEST_VAR")).thenReturn(0);
        assertEquals(400, service.updateVariable(validReq).getCode().intValue());
        verify(mapper, never()).update(any());
    }

    @Test @DisplayName("update-success-createdByUser有值")
    void testUpd_Success_WithUser() {
        when(mapper.countByVariable("TEST_VAR")).thenReturn(1);
        when(mapper.update(any())).thenReturn(1);
        assertEquals(200, service.updateVariable(validReq).getCode().intValue());
        verify(mapper, times(1)).update(argThat(e -> "test_user".equals(e.getUpdateUser())));
    }

    @Test @DisplayName("update-success-createdByUser为null用SYSTEM")
    void testUpd_Success_UserNull() {
        validReq.setCreatedByUser(null);
        when(mapper.countByVariable("TEST_VAR")).thenReturn(1);
        when(mapper.update(any())).thenReturn(1);
        assertEquals(200, service.updateVariable(validReq).getCode().intValue());
        verify(mapper, times(1)).update(argThat(e -> "SYSTEM".equals(e.getUpdateUser())));
    }

    @Test @DisplayName("update-update返回0-500")
    void testUpd_UpdateFails() {
        when(mapper.countByVariable("TEST_VAR")).thenReturn(1);
        when(mapper.update(any())).thenReturn(0);
        assertEquals(500, service.updateVariable(validReq).getCode().intValue());
    }

    @Test @DisplayName("update-异常-500")
    void testUpd_Exception() {
        when(mapper.countByVariable("TEST_VAR")).thenThrow(new RuntimeException());
        assertEquals(500, service.updateVariable(validReq).getCode().intValue());
    }

    // ============================================================
    // deleteVariable
    // ============================================================
    @Test @DisplayName("delete-variable为null-400") void testDel_VarNull() { validReq.setVariable(null); assertEquals(400, service.deleteVariable(validReq.getVariable()).getCode().intValue()); verifyNoInteractions(mapper); }
    @Test @DisplayName("delete-variable为空-400") void testDel_VarEmpty() { validReq.setVariable(""); assertEquals(400, service.deleteVariable(validReq.getVariable()).getCode().intValue()); verifyNoInteractions(mapper); }
    @Test @DisplayName("delete-variable超过20-400") void testDel_VarTooLong() { validReq.setVariable("A".repeat(21)); assertEquals(400, service.deleteVariable(validReq.getVariable()).getCode().intValue()); verifyNoInteractions(mapper); }

    @Test @DisplayName("delete-记录不存在-400")
    void testDel_NotFound() {
        when(mapper.countByVariable("TEST_VAR")).thenReturn(0);
        assertEquals(400, service.deleteVariable(validReq.getVariable()).getCode().intValue());
        verify(mapper, never()).deleteByVariable(any());
    }

    @Test @DisplayName("delete-success")
    void testDel_Success() {
        when(mapper.countByVariable("TEST_VAR")).thenReturn(1);
        when(mapper.deleteByVariable("TEST_VAR")).thenReturn(1);
        assertEquals(200, service.deleteVariable(validReq.getVariable()).getCode().intValue());
        verify(mapper, times(1)).deleteByVariable("TEST_VAR");
    }

    @Test @DisplayName("delete-删除返回0-500")
    void testDel_DeleteFails() {
        when(mapper.countByVariable("TEST_VAR")).thenReturn(1);
        when(mapper.deleteByVariable("TEST_VAR")).thenReturn(0);
        assertEquals(500, service.deleteVariable(validReq.getVariable()).getCode().intValue());
    }

    @Test @DisplayName("delete-异常-500")
    void testDel_Exception() {
        when(mapper.countByVariable("TEST_VAR")).thenThrow(new RuntimeException());
        assertEquals(500, service.deleteVariable(validReq.getVariable()).getCode().intValue());
    }

    // ============================================================
    // searchVariables
    // ============================================================
    @Test @DisplayName("search-variable为null-400") void testSearch_VarNull() { validReq.setVariable(null); assertEquals(400, service.searchVariables(validReq).getCode().intValue()); verifyNoInteractions(mapper); }
    @Test @DisplayName("search-variable为空-400") void testSearch_VarEmpty() { validReq.setVariable(""); assertEquals(400, service.searchVariables(validReq).getCode().intValue()); verifyNoInteractions(mapper); }
    @Test @DisplayName("search-variable超过20-400") void testSearch_VarTooLong() { validReq.setVariable("A".repeat(21)); assertEquals(400, service.searchVariables(validReq).getCode().intValue()); verifyNoInteractions(mapper); }

    @Test @DisplayName("search-success-全字段填充")
    void testSearch_Success_AllFields() {
        validReq.setVariable("TEST");
        validReq.setType("VDA");
        validReq.setDescription("desc");
        validReq.setCreatedByUser("user");
        validReq.setDate("2026-07-03");

        when(mapper.searchVariables(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.singletonList(validReq));

        assertEquals(200, service.searchVariables(validReq).getCode().intValue());
    }

    @Test @DisplayName("search-操作符!=触发ne路径")
    void testSearch_OperatorNe() {
        validReq.setVariable("TEST");
        validReq.setVariableOperator("!=");
        validReq.setTypeOperator("!=");
        validReq.setDescriptionOperator("!=");

        when(mapper.searchVariables(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new ArrayList<>());

        assertEquals(200, service.searchVariables(validReq).getCode().intValue());
    }

    @Test @DisplayName("search-操作符null触发默认eq")
    void testSearch_OperatorNull() {
        validReq.setVariable("TEST");
        validReq.setVariableOperator(null);
        validReq.setTypeOperator(null);
        validReq.setDescriptionOperator(null);

        when(mapper.searchVariables(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new ArrayList<>());

        assertEquals(200, service.searchVariables(validReq).getCode().intValue());
    }

    @Test @DisplayName("search-escapeLikeParam空字段返回null")
    void testSearch_EscapeNull() {
        validReq.setVariable("TEST");
        validReq.setType("");
        validReq.setDescription(null);
        validReq.setCreatedByUser("");
        validReq.setDate(null);

        when(mapper.searchVariables(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new ArrayList<>());

        assertEquals(200, service.searchVariables(validReq).getCode().intValue());
    }

    @Test @DisplayName("search-异常-500")
    void testSearch_Exception() {
        when(mapper.searchVariables(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException());
        validReq.setVariable("TEST");
        assertEquals(500, service.searchVariables(validReq).getCode().intValue());
    }

    // ============================================================
    // escapeLikeParam（私有方法通过search间接测试）
    // ============================================================
    @Test @DisplayName("escapeLikeParam-%和_转义")
    void testEscapeLikeParam() throws Exception {
        java.lang.reflect.Method m = UD10HdocVariablesServiceImpl.class.getDeclaredMethod("escapeLikeParam", String.class);
        m.setAccessible(true);
        assertNull(m.invoke(service, (Object) null));
        assertNull(m.invoke(service, ""));
        assertEquals("abc", m.invoke(service, "abc"));
        assertEquals("\\%test", m.invoke(service, "%test"));
        assertEquals("test\\_val", m.invoke(service, "test_val"));
        assertEquals("a\\%b\\_c", m.invoke(service, "a%b_c"));
        assertEquals("path\\\\to", m.invoke(service, "path\\to"));
    }

    // ============================================================
    // mapOperatorForXml（私有方法通过search间接测试）
    // ============================================================
    @Test @DisplayName("mapOperatorForXml-全路径")
    void testMapOperatorForXml() throws Exception {
        java.lang.reflect.Method m = UD10HdocVariablesServiceImpl.class.getDeclaredMethod("mapOperatorForXml", String.class);
        m.setAccessible(true);
        assertEquals("eq", m.invoke(service, (Object) null));
        assertEquals("eq", m.invoke(service, "="));
        assertEquals("ne", m.invoke(service, "!="));
        assertEquals("eq", m.invoke(service, "unknown"));
    }
}
