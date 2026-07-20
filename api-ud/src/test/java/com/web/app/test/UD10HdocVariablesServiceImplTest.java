package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocVariables;
import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.service.impl.UD10HdocVariablesServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * UD10HdocVariablesServiceImpl 单元测试
 * 覆盖所有分支路径，达到100%分支覆盖率
 */
@ExtendWith(MockitoExtension.class)
class UD10HdocVariablesServiceImplTest {

    @Mock
    private HdocVariablesMapper hdocVariablesMapper;

    @InjectMocks
    private UD10HdocVariablesServiceImpl service;

    private HdocVariables createValidAddRequest() {
        HdocVariables r = new HdocVariables();
        r.setVariable("TEST_VAR");
        r.setType("VDA");
        r.setDescription("Test description");
        r.setCreatedByUser("admin");
        return r;
    }

    // ============================================================
    // addVariable() — 参数校验
    // ============================================================

    @Test
    @DisplayName("addVariable - variable为null，应返回400")
    void addVariable_VariableNull_ShouldReturn400() {
        HdocVariables r = createValidAddRequest();
        r.setVariable(null);

        ApiResponse<?> result = service.addVariable(r);

        assertEquals(400, result.getCode());
        assertEquals("Variable不能为空", result.getMsg());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("addVariable - variable为空字符串，应返回400")
    void addVariable_VariableEmpty_ShouldReturn400() {
        HdocVariables r = createValidAddRequest();
        r.setVariable("");

        ApiResponse<?> result = service.addVariable(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("addVariable - variable为空白字符串，应返回400")
    void addVariable_VariableBlank_ShouldReturn400() {
        HdocVariables r = createValidAddRequest();
        r.setVariable("   ");

        ApiResponse<?> result = service.addVariable(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("addVariable - variable超过30字符，应返回400")
    void addVariable_VariableTooLong_ShouldReturn400() {
        HdocVariables r = createValidAddRequest();
        r.setVariable(new String(new char[31]).replace('\0', 'V'));

        ApiResponse<?> result = service.addVariable(r);

        assertEquals(400, result.getCode());
        assertEquals("Variable长度不能超过30", result.getMsg());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("addVariable - type超过50字符，应返回400")
    void addVariable_TypeTooLong_ShouldReturn400() {
        HdocVariables r = createValidAddRequest();
        r.setType(new String(new char[51]).replace('\0', 'T'));

        ApiResponse<?> result = service.addVariable(r);

        assertEquals(400, result.getCode());
        assertEquals("Type长度不能超过50", result.getMsg());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("addVariable - type为null（未设置），应通过长度校验")
    void addVariable_TypeNull_ShouldPassValidation() {
        HdocVariables r = createValidAddRequest();
        r.setType(null);
        when(hdocVariablesMapper.countByVariable("TEST_VAR")).thenReturn(0);
        when(hdocVariablesMapper.insert(any())).thenReturn(1);

        ApiResponse<?> result = service.addVariable(r);

        assertEquals(200, result.getCode());
        verify(hdocVariablesMapper, times(1)).insert(any());
    }

    @Test
    @DisplayName("addVariable - description超过200字符，应返回400")
    void addVariable_DescriptionTooLong_ShouldReturn400() {
        HdocVariables r = createValidAddRequest();
        r.setDescription(new String(new char[201]).replace('\0', 'D'));

        ApiResponse<?> result = service.addVariable(r);

        assertEquals(400, result.getCode());
        assertEquals("Description长度不能超过200", result.getMsg());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("addVariable - description为null（未设置），应通过长度校验")
    void addVariable_DescriptionNull_ShouldPassValidation() {
        HdocVariables r = createValidAddRequest();
        r.setDescription(null);
        when(hdocVariablesMapper.countByVariable("TEST_VAR")).thenReturn(0);
        when(hdocVariablesMapper.insert(any())).thenReturn(1);

        ApiResponse<?> result = service.addVariable(r);

        assertEquals(200, result.getCode());
        verify(hdocVariablesMapper, times(1)).insert(any());
    }

    // ============================================================
    // addVariable() — 业务逻辑
    // ============================================================

    @Test
    @DisplayName("addVariable - 变量已存在，应返回400")
    void addVariable_VariableExists_ShouldReturn400() {
        HdocVariables r = createValidAddRequest();
        when(hdocVariablesMapper.countByVariable("TEST_VAR")).thenReturn(1);

        ApiResponse<?> result = service.addVariable(r);

        assertEquals(400, result.getCode());
        assertEquals("变量已存在", result.getMsg());
        verify(hdocVariablesMapper, never()).insert(any());
    }

    @Test
    @DisplayName("addVariable - createdByUser为null，应使用SYSTEM")
    void addVariable_CreatedByUserNull_ShouldUseSystem() {
        HdocVariables r = createValidAddRequest();
        r.setCreatedByUser(null);
        when(hdocVariablesMapper.countByVariable("TEST_VAR")).thenReturn(0);
        when(hdocVariablesMapper.insert(any())).thenReturn(1);

        ApiResponse<?> result = service.addVariable(r);

        assertEquals(200, result.getCode());
        verify(hdocVariablesMapper, times(1)).insert(argThat(entity ->
                "SYSTEM".equals(entity.getRegisterUser()) &&
                "SYSTEM".equals(entity.getUpdateUser()) &&
                "UD10_ADD".equals(entity.getRegisterProcess()) &&
                "UD10_ADD".equals(entity.getUpdateProcess())
        ));
    }

    @Test
    @DisplayName("addVariable - createdByUser为空字符串，应使用SYSTEM")
    void addVariable_CreatedByUserEmpty_ShouldUseSystem() {
        HdocVariables r = createValidAddRequest();
        r.setCreatedByUser("");
        when(hdocVariablesMapper.countByVariable("TEST_VAR")).thenReturn(0);
        when(hdocVariablesMapper.insert(any())).thenReturn(1);

        ApiResponse<?> result = service.addVariable(r);

        assertEquals(200, result.getCode());
        verify(hdocVariablesMapper, times(1)).insert(argThat(entity ->
                "SYSTEM".equals(entity.getRegisterUser())
        ));
    }

    @Test
    @DisplayName("addVariable - 插入成功，应返回成功")
    void addVariable_InsertSuccess_ShouldReturnSuccess() {
        HdocVariables r = createValidAddRequest();
        when(hdocVariablesMapper.countByVariable("TEST_VAR")).thenReturn(0);
        when(hdocVariablesMapper.insert(any())).thenReturn(1);

        ApiResponse<?> result = service.addVariable(r);

        assertEquals(200, result.getCode());
        assertEquals("添加变量成功", result.getMsg());
        assertNotNull(result.getData());
    }

    @Test
    @DisplayName("addVariable - 插入返回0，应返回500")
    void addVariable_InsertReturnsZero_ShouldReturn500() {
        HdocVariables r = createValidAddRequest();
        when(hdocVariablesMapper.countByVariable("TEST_VAR")).thenReturn(0);
        when(hdocVariablesMapper.insert(any())).thenReturn(0);

        ApiResponse<?> result = service.addVariable(r);

        assertEquals(500, result.getCode());
        assertEquals("添加变量失败，请重试", result.getMsg());
    }

    @Test
    @DisplayName("addVariable - Mapper异常，应返回500")
    void addVariable_MapperThrowsException_ShouldReturn500() {
        HdocVariables r = createValidAddRequest();
        when(hdocVariablesMapper.countByVariable("TEST_VAR"))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.addVariable(r);

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // updateVariable() — 参数校验
    // ============================================================

    @Test
    @DisplayName("updateVariable - variable为null，应返回400")
    void updateVariable_VariableNull_ShouldReturn400() {
        HdocVariables r = createValidAddRequest();
        r.setVariable(null);

        ApiResponse<?> result = service.updateVariable(r);

        assertEquals(400, result.getCode());
        assertEquals("Variable不能为空", result.getMsg());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("updateVariable - variable为空字符串，应返回400")
    void updateVariable_VariableEmpty_ShouldReturn400() {
        HdocVariables r = createValidAddRequest();
        r.setVariable("");

        ApiResponse<?> result = service.updateVariable(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("updateVariable - variable为空白字符串，应返回400")
    void updateVariable_VariableBlank_ShouldReturn400() {
        HdocVariables r = createValidAddRequest();
        r.setVariable("   ");

        ApiResponse<?> result = service.updateVariable(r);

        assertEquals(400, result.getCode());
        assertEquals("Variable不能为空", result.getMsg());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("updateVariable - variable超过30字符，应返回400")
    void updateVariable_VariableTooLong_ShouldReturn400() {
        HdocVariables r = createValidAddRequest();
        r.setVariable(new String(new char[31]).replace('\0', 'V'));

        ApiResponse<?> result = service.updateVariable(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("updateVariable - type超过50字符，应返回400")
    void updateVariable_TypeTooLong_ShouldReturn400() {
        HdocVariables r = createValidAddRequest();
        r.setType(new String(new char[51]).replace('\0', 'T'));

        ApiResponse<?> result = service.updateVariable(r);

        assertEquals(400, result.getCode());
        assertEquals("Type长度不能超过50", result.getMsg());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("updateVariable - description超过200字符，应返回400")
    void updateVariable_DescriptionTooLong_ShouldReturn400() {
        HdocVariables r = createValidAddRequest();
        r.setDescription(new String(new char[201]).replace('\0', 'D'));

        ApiResponse<?> result = service.updateVariable(r);

        assertEquals(400, result.getCode());
        assertEquals("Description长度不能超过200", result.getMsg());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("updateVariable - type为null，应通过长度校验")
    void updateVariable_TypeNull_ShouldPassValidation() {
        HdocVariables r = createValidAddRequest();
        r.setType(null);
        when(hdocVariablesMapper.countByVariable("TEST_VAR")).thenReturn(1);
        when(hdocVariablesMapper.update(any())).thenReturn(1);

        ApiResponse<?> result = service.updateVariable(r);

        assertEquals(200, result.getCode());
        verify(hdocVariablesMapper, times(1)).update(any());
    }

    @Test
    @DisplayName("updateVariable - description为null，应通过长度校验")
    void updateVariable_DescriptionNull_ShouldPassValidation() {
        HdocVariables r = createValidAddRequest();
        r.setDescription(null);
        when(hdocVariablesMapper.countByVariable("TEST_VAR")).thenReturn(1);
        when(hdocVariablesMapper.update(any())).thenReturn(1);

        ApiResponse<?> result = service.updateVariable(r);

        assertEquals(200, result.getCode());
        verify(hdocVariablesMapper, times(1)).update(any());
    }

    @Test
    @DisplayName("updateVariable - type和description为有效值，应通过长度校验")
    void updateVariable_TypeAndDescriptionValid_ShouldPassValidation() {
        HdocVariables r = createValidAddRequest();
        r.setType("VALID_TYPE");
        r.setDescription("Valid description");
        when(hdocVariablesMapper.countByVariable("TEST_VAR")).thenReturn(1);
        when(hdocVariablesMapper.update(any())).thenReturn(1);

        ApiResponse<?> result = service.updateVariable(r);

        assertEquals(200, result.getCode());
        verify(hdocVariablesMapper, times(1)).update(any());
    }

    // ============================================================
    // updateVariable() — 业务逻辑
    // ============================================================

    @Test
    @DisplayName("updateVariable - 记录不存在，应返回400")
    void updateVariable_NotFound_ShouldReturn400() {
        HdocVariables r = createValidAddRequest();
        when(hdocVariablesMapper.countByVariable("TEST_VAR")).thenReturn(0);

        ApiResponse<?> result = service.updateVariable(r);

        assertEquals(400, result.getCode());
        assertEquals("记录不存在", result.getMsg());
        verify(hdocVariablesMapper, never()).update(any());
    }

    @Test
    @DisplayName("updateVariable - createdByUser为null，应使用SYSTEM")
    void updateVariable_CreatedByUserNull_ShouldUseSystem() {
        HdocVariables r = createValidAddRequest();
        r.setCreatedByUser(null);
        when(hdocVariablesMapper.countByVariable("TEST_VAR")).thenReturn(1);
        when(hdocVariablesMapper.update(any())).thenReturn(1);

        ApiResponse<?> result = service.updateVariable(r);

        assertEquals(200, result.getCode());
        verify(hdocVariablesMapper, times(1)).update(argThat(entity ->
                "SYSTEM".equals(entity.getUpdateUser()) &&
                "UD10_UPDATE".equals(entity.getUpdateProcess())
        ));
    }

    @Test
    @DisplayName("updateVariable - createdByUser为空字符串，应使用SYSTEM")
    void updateVariable_CreatedByUserEmpty_ShouldUseSystem() {
        HdocVariables r = createValidAddRequest();
        r.setCreatedByUser("");
        when(hdocVariablesMapper.countByVariable("TEST_VAR")).thenReturn(1);
        when(hdocVariablesMapper.update(any())).thenReturn(1);

        ApiResponse<?> result = service.updateVariable(r);

        assertEquals(200, result.getCode());
        verify(hdocVariablesMapper, times(1)).update(argThat(entity ->
                "SYSTEM".equals(entity.getUpdateUser())
        ));
    }

    @Test
    @DisplayName("updateVariable - 更新成功，应返回成功")
    void updateVariable_UpdateSuccess_ShouldReturnSuccess() {
        HdocVariables r = createValidAddRequest();
        when(hdocVariablesMapper.countByVariable("TEST_VAR")).thenReturn(1);
        when(hdocVariablesMapper.update(any())).thenReturn(1);

        ApiResponse<?> result = service.updateVariable(r);

        assertEquals(200, result.getCode());
        assertEquals("更新变量成功", result.getMsg());
        assertNotNull(result.getData());
    }

    @Test
    @DisplayName("updateVariable - 更新返回0，应返回500")
    void updateVariable_UpdateReturnsZero_ShouldReturn500() {
        HdocVariables r = createValidAddRequest();
        when(hdocVariablesMapper.countByVariable("TEST_VAR")).thenReturn(1);
        when(hdocVariablesMapper.update(any())).thenReturn(0);

        ApiResponse<?> result = service.updateVariable(r);

        assertEquals(500, result.getCode());
        assertEquals("更新变量失败，请重试", result.getMsg());
    }

    @Test
    @DisplayName("updateVariable - Mapper异常，应返回500")
    void updateVariable_MapperThrowsException_ShouldReturn500() {
        HdocVariables r = createValidAddRequest();
        when(hdocVariablesMapper.countByVariable("TEST_VAR"))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.updateVariable(r);

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // deleteVariable() — 参数校验与业务逻辑
    // ============================================================

    @Test
    @DisplayName("deleteVariable - variable为null，应返回400")
    void deleteVariable_VariableNull_ShouldReturn400() {
        ApiResponse<?> result = service.deleteVariable(null);

        assertEquals(400, result.getCode());
        assertEquals("Variable不能为空", result.getMsg());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("deleteVariable - variable为空字符串，应返回400")
    void deleteVariable_VariableEmpty_ShouldReturn400() {
        ApiResponse<?> result = service.deleteVariable("");

        assertEquals(400, result.getCode());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("deleteVariable - variable为空白字符串，应返回400")
    void deleteVariable_VariableBlank_ShouldReturn400() {
        ApiResponse<?> result = service.deleteVariable("   ");

        assertEquals(400, result.getCode());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("deleteVariable - variable超过30字符，应返回400")
    void deleteVariable_VariableTooLong_ShouldReturn400() {
        ApiResponse<?> result = service.deleteVariable(new String(new char[31]).replace('\0', 'V'));

        assertEquals(400, result.getCode());
        assertEquals("Variable长度不能超过30", result.getMsg());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("deleteVariable - 记录不存在，应返回400")
    void deleteVariable_NotFound_ShouldReturn400() {
        when(hdocVariablesMapper.countByVariable("TEST_VAR")).thenReturn(0);

        ApiResponse<?> result = service.deleteVariable("TEST_VAR");

        assertEquals(400, result.getCode());
        assertEquals("记录不存在", result.getMsg());
        verify(hdocVariablesMapper, never()).deleteByVariable(any());
    }

    @Test
    @DisplayName("deleteVariable - 删除成功，应返回成功")
    void deleteVariable_DeleteSuccess_ShouldReturnSuccess() {
        when(hdocVariablesMapper.countByVariable("TEST_VAR")).thenReturn(1);
        when(hdocVariablesMapper.deleteByVariable("TEST_VAR")).thenReturn(1);

        ApiResponse<?> result = service.deleteVariable("TEST_VAR");

        assertEquals(200, result.getCode());
        assertEquals("删除变量成功", result.getMsg());
        assertNotNull(result.getData());
    }

    @Test
    @DisplayName("deleteVariable - 删除返回0，应返回500")
    void deleteVariable_DeleteReturnsZero_ShouldReturn500() {
        when(hdocVariablesMapper.countByVariable("TEST_VAR")).thenReturn(1);
        when(hdocVariablesMapper.deleteByVariable("TEST_VAR")).thenReturn(0);

        ApiResponse<?> result = service.deleteVariable("TEST_VAR");

        assertEquals(500, result.getCode());
        assertEquals("删除变量失败，请重试", result.getMsg());
    }

    @Test
    @DisplayName("deleteVariable - Mapper异常，应返回500")
    void deleteVariable_MapperThrowsException_ShouldReturn500() {
        when(hdocVariablesMapper.countByVariable("TEST_VAR"))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.deleteVariable("TEST_VAR");

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // searchVariables() — 参数校验
    // ============================================================

    @Test
    @DisplayName("searchVariables - variable为null，应返回400")
    void searchVariables_VariableNull_ShouldReturn400() {
        HdocVariables r = new HdocVariables();
        r.setVariable(null);

        ApiResponse<?> result = service.searchVariables(r);

        assertEquals(400, result.getCode());
        assertEquals("Variable不能为空", result.getMsg());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("searchVariables - variable为空字符串，应返回400")
    void searchVariables_VariableEmpty_ShouldReturn400() {
        HdocVariables r = new HdocVariables();
        r.setVariable("");

        ApiResponse<?> result = service.searchVariables(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("searchVariables - variable超过30字符，应返回400")
    void searchVariables_VariableTooLong_ShouldReturn400() {
        HdocVariables r = new HdocVariables();
        r.setVariable(new String(new char[31]).replace('\0', 'V'));

        ApiResponse<?> result = service.searchVariables(r);

        assertEquals(400, result.getCode());
        assertEquals("Variable长度不能超过30", result.getMsg());
        verifyNoInteractions(hdocVariablesMapper);
    }

    // ============================================================
    // searchVariables() — 操作符与查询逻辑
    // ============================================================

    @Test
    @DisplayName("searchVariables - 默认操作符(null)，mapper返回null，应返回空列表")
    void searchVariables_DefaultOperatorsResultNull_ShouldReturnEmptyList() {
        HdocVariables r = new HdocVariables();
        r.setVariable("TEST_VAR");

        when(hdocVariablesMapper.searchVariables(
                eq("TEST_VAR"), eq("eq"),
                isNull(), eq("eq"),
                isNull(), eq("eq"),
                isNull(), eq("eq"),
                isNull(), eq("eq")
        )).thenReturn(null);

        ApiResponse<?> result = service.searchVariables(r);

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertTrue(((List<?>) result.getData()).isEmpty());
        verify(hdocVariablesMapper, times(1)).searchVariables(
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any());
    }

    @Test
    @DisplayName("searchVariables - 操作符为!=，不应走escapeLikeParam")
    void searchVariables_OperatorNotEqual_ShouldSkipEscape() {
        HdocVariables r = new HdocVariables();
        r.setVariable("TEST_VAR");
        r.setVariableOperator("!=");
        r.setType("TYPE_A");
        r.setTypeOperator("!=");
        r.setDescription("DESC");
        r.setDescriptionOperator("!=");
        r.setCreatedByUser("admin");
        r.setCreatedByUserOperator("!=");
        r.setDate("202607");
        r.setDateOperator("!=");

        when(hdocVariablesMapper.searchVariables(
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any()))
                .thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.searchVariables(r);

        assertEquals(200, result.getCode());
        assertTrue(((List<?>) result.getData()).isEmpty());
    }

    @Test
    @DisplayName("searchVariables - 操作符为无效值，应使用默认eq并触发escapeLikeParam")
    void searchVariables_InvalidOperator_ShouldUseDefaultEq() {
        HdocVariables r = new HdocVariables();
        r.setVariable("TEST_VAR");
        r.setVariableOperator("INVALID");
        r.setType("TYPE_A");

        when(hdocVariablesMapper.searchVariables(
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any()))
                .thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.searchVariables(r);

        assertEquals(200, result.getCode());
    }

    @Test
    @DisplayName("searchVariables - escapeLikeParam处理空白和特殊字符")
    void searchVariables_EscapeLikeParam_ShouldEscapeCorrectly() {
        HdocVariables r = new HdocVariables();
        r.setVariable("TEST_VAR");
        // operator默认null→"eq"→触发escapeLikeParam
        r.setType("   ");  // 空白 → escapeLikeParam返回null

        when(hdocVariablesMapper.searchVariables(
                any(), any(), isNull(), any(), any(), any(),
                any(), any(), any(), any()))
                .thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.searchVariables(r);

        assertEquals(200, result.getCode());
    }

    @Test
    @DisplayName("searchVariables - escapeLikeParam处理含转义字符")
    void searchVariables_EscapeLikeParamWithSpecialChars_ShouldEscape() {
        HdocVariables r = new HdocVariables();
        r.setVariable("TEST_VAR");
        r.setType("TYPE%_A");   // 含%和_
        r.setDescription("DESC\\B"); // 含反斜杠

        when(hdocVariablesMapper.searchVariables(
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any()))
                .thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.searchVariables(r);

        assertEquals(200, result.getCode());
    }

    @Test
    @DisplayName("searchVariables - mapper返回非空列表，应返回成功数据")
    void searchVariables_ResultNotEmpty_ShouldReturnSuccessWithData() {
        HdocVariables r = new HdocVariables();
        r.setVariable("TEST_VAR");

        HdocVariables v = new HdocVariables();
        v.setVariable("TEST_VAR");
        v.setType("VDA");
        v.setDescription("Test");
        v.setRegisterUser("admin");
        v.setRegisterDatetime("2026-07-20 10:00:00");
        when(hdocVariablesMapper.searchVariables(
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any()))
                .thenReturn(Collections.singletonList(v));

        ApiResponse<?> result = service.searchVariables(r);

        assertEquals(200, result.getCode());
        assertEquals("搜索变量成功", result.getMsg());
        assertNotNull(result.getData());
        List<?> dataList = (List<?>) result.getData();
        assertEquals(1, dataList.size());
        Map<?, ?> item = (Map<?, ?>) dataList.get(0);
        assertEquals("TEST_VAR", item.get("variable"));
        assertEquals("VDA", item.get("type"));
        assertEquals("Test", item.get("description"));
        assertEquals("admin", item.get("createdByUser"));
        assertEquals("2026-07-20 10:00:00", item.get("date"));
    }

    @Test
    @DisplayName("searchVariables - Mapper异常，应返回500")
    void searchVariables_MapperThrowsException_ShouldReturn500() {
        HdocVariables r = new HdocVariables();
        r.setVariable("TEST_VAR");
        when(hdocVariablesMapper.searchVariables(
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any()))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.searchVariables(r);

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }
}
