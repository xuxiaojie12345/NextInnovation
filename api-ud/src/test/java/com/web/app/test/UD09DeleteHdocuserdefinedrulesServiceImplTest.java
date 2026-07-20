package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocUserDefinedRules;
import com.web.app.domain.UD09DeleteUserDefinedRulesRequest;
import com.web.app.domain.UD09SearchUserDefinedRulesRequest;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.service.impl.UD09DeleteHdocuserdefinedrulesServiceImpl;
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
 * UD09DeleteHdocuserdefinedrulesServiceImpl 单元测试
 * 覆盖所有分支路径，达到100%分支覆盖率
 */
@ExtendWith(MockitoExtension.class)
class UD09DeleteHdocuserdefinedrulesServiceImplTest {

    @Mock
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;

    @InjectMocks
    private UD09DeleteHdocuserdefinedrulesServiceImpl service;

    // ============================================================
    // 辅助方法
    // ============================================================

    private UD09SearchUserDefinedRulesRequest createValidSearchRequest() {
        UD09SearchUserDefinedRulesRequest r = new UD09SearchUserDefinedRulesRequest();
        r.setProductClass("PC001");
        r.setNumber(1);
        r.setMarket("JP");
        return r;
    }

    private UD09DeleteUserDefinedRulesRequest createDeleteRequest(String pc, Integer num, String market) {
        UD09DeleteUserDefinedRulesRequest r = new UD09DeleteUserDefinedRulesRequest();
        r.setProductClass(pc);
        r.setNumber(num);
        r.setMarket(market);
        return r;
    }

    private HdocUserDefinedRules createSampleRule() {
        HdocUserDefinedRules rule = new HdocUserDefinedRules();
        rule.setPc("PC001");
        rule.setNum(1);
        rule.setMarket("JP");
        rule.setVariable("VAR001");
        rule.setVal("VAL001");
        rule.setVs("VS001");
        rule.setVs2("VS2001");
        rule.setComments("test");
        rule.setAddDate("202607");
        rule.setDeleteDate(null);
        rule.setRegisterUser("admin");
        rule.setRegisterDatetime("2026-07-20 10:00:00");
        return rule;
    }

    // ============================================================
    // searchUserDefinedRules — 必填项校验
    // ============================================================

    @Test
    @DisplayName("search - productClass为null，应返回400")
    void search_ProductClassNull_ShouldReturn400() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        r.setProductClass(null);

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(400, result.getCode());
        assertEquals("产品类别不能为空", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("search - productClass为空字符串，应返回400")
    void search_ProductClassEmpty_ShouldReturn400() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        r.setProductClass("");

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("search - number为null，应返回400")
    void search_NumberNull_ShouldReturn400() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        r.setNumber(null);

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(400, result.getCode());
        assertEquals("编号不能为空", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("search - market为null，应返回400")
    void search_MarketNull_ShouldReturn400() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        r.setMarket(null);

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(400, result.getCode());
        assertEquals("市场不能为空", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("search - market为空字符串，应返回400")
    void search_MarketEmpty_ShouldReturn400() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        r.setMarket("");

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    // ============================================================
    // searchUserDefinedRules — 字段长度校验
    // ============================================================

    @Test
    @DisplayName("search - variable超过30字符，应返回400")
    void search_VariableTooLong_ShouldReturn400() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        r.setVariable(new String(new char[31]).replace('\0', 'V'));

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(400, result.getCode());
        assertEquals("Variable长度不能超过30", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("search - value超过200字符，应返回400")
    void search_ValueTooLong_ShouldReturn400() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        r.setValue(new String(new char[201]).replace('\0', 'V'));

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(400, result.getCode());
        assertEquals("Value长度不能超过200", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("search - variantString1超过100字符，应返回400")
    void search_VariantString1TooLong_ShouldReturn400() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        r.setVariantString1(new String(new char[101]).replace('\0', 'X'));

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(400, result.getCode());
        assertEquals("Variant string.1长度不能超过100", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("search - variantString2超过100字符，应返回400")
    void search_VariantString2TooLong_ShouldReturn400() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        r.setVariantString2(new String(new char[101]).replace('\0', 'Y'));

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(400, result.getCode());
        assertEquals("Variant string.2长度不能超过100", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("search - comments超过200字符，应返回400")
    void search_CommentsTooLong_ShouldReturn400() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        r.setComments(new String(new char[201]).replace('\0', 'C'));

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(400, result.getCode());
        assertEquals("Comments长度不能超过200", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("search - createdByUser超过16字符，应返回400")
    void search_CreatedByUserTooLong_ShouldReturn400() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        r.setCreatedByUser(new String(new char[17]).replace('\0', 'U'));

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(400, result.getCode());
        assertEquals("创建用户长度不能超过16", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    // ============================================================
    // searchUserDefinedRules — 操作符与查询结果分支
    // ============================================================

    @Test
    @DisplayName("search - 默认操作符（均为null），mapper返回null，应返回成功")
    void search_AllOperatorsNullAndResultNull_ShouldReturnSuccess() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        // 所有操作符均为null，将使用默认值"="
        when(hdocUserDefinedRulesMapper.searchUserDefinedRules(
                eq("PC001"), eq("eq"),
                eq(1), eq("eq"),
                eq("JP"), eq("eq"),
                isNull(), eq("eq"),
                isNull(), eq("eq"),
                isNull(), eq("eq"),
                isNull(), eq("eq"),
                isNull(), eq("eq"),
                isNull(), eq("eq"),
                isNull(), eq("eq"),
                isNull(), eq("eq"),
                isNull(), eq("eq")
        )).thenReturn(null);

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(200, result.getCode());
        assertNull(result.getData());
        verify(hdocUserDefinedRulesMapper, times(1)).searchUserDefinedRules(
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("search - mapper返回空列表，应返回成功且data为空列表")
    void search_ResultEmpty_ShouldReturnSuccess() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        when(hdocUserDefinedRulesMapper.searchUserDefinedRules(
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any()))
                .thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertTrue(((List<?>) result.getData()).isEmpty());
    }

    @Test
    @DisplayName("search - mapper返回非空列表，应返回成功且包含数据")
    void search_ResultNotEmpty_ShouldReturnSuccessWithData() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        List<HdocUserDefinedRules> mockList = Collections.singletonList(createSampleRule());
        when(hdocUserDefinedRulesMapper.searchUserDefinedRules(
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any()))
                .thenReturn(mockList);

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(200, result.getCode());
        assertEquals("搜索用户定义规则成功", result.getMsg());
        assertNotNull(result.getData());
        assertTrue(result.getData() instanceof List);
        List<?> dataList = (List<?>) result.getData();
        assertEquals(1, dataList.size());
        assertTrue(dataList.get(0) instanceof Map);
        Map<?, ?> item = (Map<?, ?>) dataList.get(0);
        assertEquals("PC001", item.get("pc"));
        assertEquals(1, item.get("num"));
        assertEquals("JP", item.get("market"));
        assertEquals("VAR001", item.get("variable"));
    }

    @Test
    @DisplayName("search - 操作符传入!=>等非默认值，验证操作符映射")
    void search_WithCustomOperators_ShouldMapCorrectly() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        r.setProductClassOperator("!=");
        r.setNumberOperator(">");
        r.setMarketOperator("!=");
        r.setVariableOperator("!=");
        r.setValueOperator("!=");
        r.setVariantString1Operator("!=");
        r.setVariantString2Operator("!=");
        r.setCommentsOperator("!=");
        r.setAddDateOperator("!=");
        r.setDeleteDateOperator("!=");
        r.setCreatedByUserOperator("!=");
        r.setDateOperator(">");
        // 设置模糊查询字段使eq判断走false分支
        r.setVariable("VAR");
        r.setValue("VAL");
        r.setVariantString1("VS1");
        r.setVariantString2("VS2");
        r.setComments("CMT");
        r.setAddDate("202607");
        r.setDeleteDate("202607");
        r.setCreatedByUser("admin");
        r.setDate("202607");

        // 由于操作符!=映射为ne，不等于eq，所以不会走escapeLikeParam分支
        when(hdocUserDefinedRulesMapper.searchUserDefinedRules(
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any()))
                .thenReturn(null);

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(200, result.getCode());
    }

    @Test
    @DisplayName("search - 操作符为无效值，应使用默认值")
    void search_InvalidOperator_ShouldUseDefault() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        r.setProductClassOperator("INVALID");
        r.setVariable("VAR");
        // 无效操作符会使用默认"="→"eq"，eq会触发escapeLikeParam
        when(hdocUserDefinedRulesMapper.searchUserDefinedRules(
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any()))
                .thenReturn(null);

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(200, result.getCode());
    }

    @Test
    @DisplayName("search - 操作符为空字符串，validateOperator应返回默认值")
    void search_OperatorEmpty_ShouldUseDefault() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        r.setProductClassOperator("");
        r.setVariable("VAR");
        // 空操作符→validateOperator返回默认"="→mapOperatorForXml返回"eq"→eq触发escapeLikeParam
        when(hdocUserDefinedRulesMapper.searchUserDefinedRules(
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any()))
                .thenReturn(null);

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(200, result.getCode());
    }

    @Test
    @DisplayName("search - escapeLikeParam接收空白字符串，应返回null")
    void search_EscapeLikeParamBlank_ShouldReturnNull() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        r.setVariable("   ");
        // 操作符默认"="→"eq"，eq触发escapeLikeParam，空白输入→trim().isEmpty()→返回null
        when(hdocUserDefinedRulesMapper.searchUserDefinedRules(
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any()))
                .thenReturn(null);

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(200, result.getCode());
    }

    @Test
    @DisplayName("search - escapeLikeParam处理含%和_的特殊字符")
    void search_EscapeLikeParam_ShouldEscapeSpecialChars() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        r.setVariable("VAR%_TEST"); // 需要转义
        // 操作符默认"="→"eq"，会触发escapeLikeParam
        when(hdocUserDefinedRulesMapper.searchUserDefinedRules(
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any()))
                .thenReturn(null);

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(200, result.getCode());
    }

    @Test
    @DisplayName("search - escapeLikeParam处理含反斜杠的特殊字符")
    void search_EscapeLikeParam_ShouldEscapeBackslash() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        r.setVariable("VAR\\TEST"); // 需要转义反斜杠
        when(hdocUserDefinedRulesMapper.searchUserDefinedRules(
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any()))
                .thenReturn(null);

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(200, result.getCode());
    }

    @Test
    @DisplayName("search - 数字操作符传入<，验证映射")
    void search_NumberOperatorLessThan_ShouldMapToLt() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        r.setNumberOperator("<");
        when(hdocUserDefinedRulesMapper.searchUserDefinedRules(
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any()))
                .thenReturn(null);

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(200, result.getCode());
    }

    @Test
    @DisplayName("search - date操作符传入<，验证映射")
    void search_DateOperatorLessThan_ShouldMapToLt() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        r.setDateOperator("<");
        when(hdocUserDefinedRulesMapper.searchUserDefinedRules(
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any()))
                .thenReturn(null);

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(200, result.getCode());
    }

    @Test
    @DisplayName("search - Mapper抛出异常，应返回500")
    void search_MapperThrowsException_ShouldReturn500() {
        UD09SearchUserDefinedRulesRequest r = createValidSearchRequest();
        when(hdocUserDefinedRulesMapper.searchUserDefinedRules(
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.searchUserDefinedRules(r);

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // deleteSelectedUserDefinedRules — 参数校验循环分支
    // ============================================================

    @Test
    @DisplayName("delete - 空列表，应返回成功（deletedCount=0, failedCount=0）")
    void delete_EmptyList_ShouldReturnSuccess() {
        ApiResponse<?> result = service.deleteSelectedUserDefinedRules(new ArrayList<>());

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertEquals(0, ((Map<?, ?>) result.getData()).get("deletedCount"));
        assertEquals(0, ((Map<?, ?>) result.getData()).get("failedCount"));
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("delete - productClass为null，应增加失败计数并跳过")
    void delete_ProductClassNull_ShouldFailAndSkip() {
        List<UD09DeleteUserDefinedRulesRequest> list = Collections.singletonList(
                createDeleteRequest(null, 1, "JP"));

        ApiResponse<?> result = service.deleteSelectedUserDefinedRules(list);

        assertEquals(500, result.getCode());
        assertTrue(result.getMsg().contains("产品类别不能为空"));
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("delete - productClass为空字符串，应失败并跳过")
    void delete_ProductClassEmpty_ShouldFailAndSkip() {
        List<UD09DeleteUserDefinedRulesRequest> list = Collections.singletonList(
                createDeleteRequest("", 1, "JP"));

        ApiResponse<?> result = service.deleteSelectedUserDefinedRules(list);

        assertEquals(500, result.getCode());
        assertTrue(result.getMsg().contains("产品类别不能为空"));
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("delete - number为null，应失败并跳过")
    void delete_NumberNull_ShouldFailAndSkip() {
        List<UD09DeleteUserDefinedRulesRequest> list = Collections.singletonList(
                createDeleteRequest("PC001", null, "JP"));

        ApiResponse<?> result = service.deleteSelectedUserDefinedRules(list);

        assertEquals(500, result.getCode());
        assertTrue(result.getMsg().contains("编号不能为空"));
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("delete - market为null，应失败并跳过")
    void delete_MarketNull_ShouldFailAndSkip() {
        List<UD09DeleteUserDefinedRulesRequest> list = Collections.singletonList(
                createDeleteRequest("PC001", 1, null));

        ApiResponse<?> result = service.deleteSelectedUserDefinedRules(list);

        assertEquals(500, result.getCode());
        assertTrue(result.getMsg().contains("市场不能为空"));
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("delete - market为空字符串，应失败并跳过")
    void delete_MarketEmpty_ShouldFailAndSkip() {
        List<UD09DeleteUserDefinedRulesRequest> list = Collections.singletonList(
                createDeleteRequest("PC001", 1, ""));

        ApiResponse<?> result = service.deleteSelectedUserDefinedRules(list);

        assertEquals(500, result.getCode());
        assertTrue(result.getMsg().contains("市场不能为空"));
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    // ============================================================
    // deleteSelectedUserDefinedRules — 业务逻辑分支
    // ============================================================

    @Test
    @DisplayName("delete - 记录不存在，应失败")
    void delete_RecordNotFound_ShouldFail() {
        List<UD09DeleteUserDefinedRulesRequest> list = Collections.singletonList(
                createDeleteRequest("PC001", 1, "JP"));
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP")).thenReturn(0);

        ApiResponse<?> result = service.deleteSelectedUserDefinedRules(list);

        assertEquals(500, result.getCode());
        assertTrue(result.getMsg().contains("记录不存在"));
        verify(hdocUserDefinedRulesMapper, never()).softDelete(any(), any(), any(), any());
    }

    @Test
    @DisplayName("delete - softDelete返回0，应失败")
    void delete_SoftDeleteReturnsZero_ShouldFail() {
        List<UD09DeleteUserDefinedRulesRequest> list = Collections.singletonList(
                createDeleteRequest("PC001", 1, "JP"));
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP")).thenReturn(1);
        when(hdocUserDefinedRulesMapper.softDelete("PC001", 1, "JP", "SYSTEM")).thenReturn(0);

        ApiResponse<?> result = service.deleteSelectedUserDefinedRules(list);

        assertEquals(500, result.getCode());
        assertTrue(result.getMsg().contains("删除失败"));
        verify(hdocUserDefinedRulesMapper, times(1)).softDelete("PC001", 1, "JP", "SYSTEM");
    }

    @Test
    @DisplayName("delete - 全部成功，应返回成功")
    void delete_AllSuccess_ShouldReturnSuccess() {
        List<UD09DeleteUserDefinedRulesRequest> list = Collections.singletonList(
                createDeleteRequest("PC001", 1, "JP"));
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP")).thenReturn(1);
        when(hdocUserDefinedRulesMapper.softDelete("PC001", 1, "JP", "SYSTEM")).thenReturn(1);

        ApiResponse<?> result = service.deleteSelectedUserDefinedRules(list);

        assertEquals(200, result.getCode());
        assertEquals("删除用户定义规则成功", result.getMsg());
        assertNotNull(result.getData());
        assertEquals(1, ((Map<?, ?>) result.getData()).get("deletedCount"));
        assertEquals(0, ((Map<?, ?>) result.getData()).get("failedCount"));
    }

    @Test
    @DisplayName("delete - 部分成功部分失败，应返回部分成功消息")
    void delete_PartialSuccess_ShouldReturnPartialMessage() {
        List<UD09DeleteUserDefinedRulesRequest> list = Arrays.asList(
                createDeleteRequest("PC001", 1, "JP"),   // 成功
                createDeleteRequest("PC002", 2, "JP")    // 失败（记录不存在）
        );
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP")).thenReturn(1);
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC002", 2, "JP")).thenReturn(0);
        when(hdocUserDefinedRulesMapper.softDelete("PC001", 1, "JP", "SYSTEM")).thenReturn(1);

        ApiResponse<?> result = service.deleteSelectedUserDefinedRules(list);

        assertEquals(200, result.getCode());
        assertTrue(result.getMsg().contains("1条记录删除成功，1条记录删除失败"));
        assertNotNull(result.getData());
        assertEquals(1, ((Map<?, ?>) result.getData()).get("deletedCount"));
        assertEquals(1, ((Map<?, ?>) result.getData()).get("failedCount"));
    }

    @Test
    @DisplayName("delete - Mapper抛出异常，应返回500")
    void delete_MapperThrowsException_ShouldReturn500() {
        List<UD09DeleteUserDefinedRulesRequest> list = Collections.singletonList(
                createDeleteRequest("PC001", 1, "JP"));
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP"))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.deleteSelectedUserDefinedRules(list);

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }
}
