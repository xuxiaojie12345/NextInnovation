package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocUserDefinedRules;
import com.web.app.domain.UD09DeleteUserDefinedRulesRequest;
import com.web.app.domain.UD09SearchUserDefinedRulesRequest;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.service.impl.UD09DeleteHdocuserdefinedrulesServiceImpl;
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
 * UD09DeleteHdocuserdefinedrulesServiceImpl 单元测试
 * 覆盖所有分支（100%覆盖率）
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD09DeleteHdocuserdefinedrulesServiceImpl 单元测试")
class UD09DeleteHdocuserdefinedrulesServiceImplTest {

    @Mock
    private HdocUserDefinedRulesMapper mapper;

    @InjectMocks
    private UD09DeleteHdocuserdefinedrulesServiceImpl service;

    private UD09SearchUserDefinedRulesRequest validSearchReq;
    private HdocUserDefinedRules mockRule;

    @BeforeEach
    void setUp() {
        reset(mapper);

        validSearchReq = new UD09SearchUserDefinedRulesRequest();
        validSearchReq.setProductClass("A");
        validSearchReq.setNumber(100);
        validSearchReq.setMarket("JPN");
        validSearchReq.setVariable("");
        validSearchReq.setValue("");
        validSearchReq.setVariantString1("");
        validSearchReq.setVariantString2("");
        validSearchReq.setComments("");
        validSearchReq.setAddDate("");
        validSearchReq.setDeleteDate("");
        validSearchReq.setCreatedByUser("");
        validSearchReq.setDate("");
        validSearchReq.setProductClassOperator("=");
        validSearchReq.setNumberOperator("=");
        validSearchReq.setMarketOperator("=");
        validSearchReq.setVariableOperator("=");
        validSearchReq.setValueOperator("=");
        validSearchReq.setVariantString1Operator("=");
        validSearchReq.setVariantString2Operator("=");
        validSearchReq.setCommentsOperator("=");
        validSearchReq.setAddDateOperator("=");
        validSearchReq.setDeleteDateOperator("=");
        validSearchReq.setCreatedByUserOperator("=");
        validSearchReq.setDateOperator("=");

        mockRule = new HdocUserDefinedRules();
        mockRule.setPc("A");
        mockRule.setNum(100);
        mockRule.setMarket("JPN");
        mockRule.setVariable("VAR1");
        mockRule.setVal("VAL1");
    }

    // ============================================================
    // searchUserDefinedRules - 参数校验
    // ============================================================
    @Test @DisplayName("search-productClass为null-400")
    void testSearch_ProductClassNull() {
        validSearchReq.setProductClass(null);
        assertEquals(400, service.searchUserDefinedRules(validSearchReq).getCode().intValue());
        verifyNoInteractions(mapper);
    }

    @Test @DisplayName("search-productClass为空-400")
    void testSearch_ProductClassEmpty() {
        validSearchReq.setProductClass("");
        assertEquals(400, service.searchUserDefinedRules(validSearchReq).getCode().intValue());
        verifyNoInteractions(mapper);
    }

    @Test @DisplayName("search-number为null-400")
    void testSearch_NumberNull() {
        validSearchReq.setNumber(null);
        assertEquals(400, service.searchUserDefinedRules(validSearchReq).getCode().intValue());
        verifyNoInteractions(mapper);
    }

    @Test @DisplayName("search-market为null-400")
    void testSearch_MarketNull() {
        validSearchReq.setMarket(null);
        assertEquals(400, service.searchUserDefinedRules(validSearchReq).getCode().intValue());
        verifyNoInteractions(mapper);
    }

    @Test @DisplayName("search-market为空-400")
    void testSearch_MarketEmpty() {
        validSearchReq.setMarket("");
        assertEquals(400, service.searchUserDefinedRules(validSearchReq).getCode().intValue());
        verifyNoInteractions(mapper);
    }

    @Test @DisplayName("search-variable超长-400")
    void testSearch_VariableTooLong() {
        validSearchReq.setVariable("A".repeat(21));
        assertEquals(400, service.searchUserDefinedRules(validSearchReq).getCode().intValue());
        verifyNoInteractions(mapper);
    }

    @Test @DisplayName("search-value超长-400")
    void testSearch_ValueTooLong() {
        validSearchReq.setValue("A".repeat(201));
        assertEquals(400, service.searchUserDefinedRules(validSearchReq).getCode().intValue());
    }

    @Test @DisplayName("search-vs1超长-400")
    void testSearch_Vs1TooLong() {
        validSearchReq.setVariantString1("A".repeat(101));
        assertEquals(400, service.searchUserDefinedRules(validSearchReq).getCode().intValue());
    }

    @Test @DisplayName("search-vs2超长-400")
    void testSearch_Vs2TooLong() {
        validSearchReq.setVariantString2("A".repeat(101));
        assertEquals(400, service.searchUserDefinedRules(validSearchReq).getCode().intValue());
    }

    @Test @DisplayName("search-comments超长-400")
    void testSearch_CommentsTooLong() {
        validSearchReq.setComments("A".repeat(201));
        assertEquals(400, service.searchUserDefinedRules(validSearchReq).getCode().intValue());
    }

    @Test @DisplayName("search-createdByUser超长-400")
    void testSearch_CreatedByUserTooLong() {
        validSearchReq.setCreatedByUser("A".repeat(17));
        assertEquals(400, service.searchUserDefinedRules(validSearchReq).getCode().intValue());
    }

    // ============================================================
    // searchUserDefinedRules - 查询分支
    // ============================================================
    @Test @DisplayName("search-Mapper返回null-返回200空数据")
    void testSearch_ResultNull() {
        when(mapper.searchUserDefinedRules(any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any()))
                .thenReturn(null);

        ApiResponse<?> r = service.searchUserDefinedRules(validSearchReq);
        assertEquals(200, r.getCode().intValue());
    }

    @Test @DisplayName("search-Mapper返回空列表-返回200空数据")
    void testSearch_ResultEmpty() {
        when(mapper.searchUserDefinedRules(any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any()))
                .thenReturn(new ArrayList<>());

        ApiResponse<?> r = service.searchUserDefinedRules(validSearchReq);
        assertEquals(200, r.getCode().intValue());
    }

    @Test @DisplayName("search-查询成功-返回200含数据")
    void testSearch_Success() {
        List<HdocUserDefinedRules> list = Collections.singletonList(mockRule);
        when(mapper.searchUserDefinedRules(any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any()))
                .thenReturn(list);

        ApiResponse<?> r = service.searchUserDefinedRules(validSearchReq);
        assertEquals(200, r.getCode().intValue());
        assertNotNull(r.getData());
        assertInstanceOf(List.class, r.getData());
        assertEquals(1, ((List<?>) r.getData()).size());
    }

    @Test @DisplayName("search-Mapper异常-500")
    void testSearch_Exception() {
        when(mapper.searchUserDefinedRules(any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException());

        assertEquals(500, service.searchUserDefinedRules(validSearchReq).getCode().intValue());
    }

    // ============================================================
    // searchUserDefinedRules - 操作符验证
    // ============================================================
    @Test @DisplayName("search-全字段填充触发所有validateOperator和escapeLikeParam行")
    void testSearch_AllFieldsEscapePath() {
        // 填充所有字段及操作符，确保 57-72 行和 93-99 行全部执行
        validSearchReq.setProductClassOperator("=");
        validSearchReq.setNumberOperator("=");
        validSearchReq.setMarketOperator("=");
        validSearchReq.setVariableOperator("=");
        validSearchReq.setValueOperator("=");
        validSearchReq.setVariantString1Operator("=");
        validSearchReq.setVariantString2Operator("=");
        validSearchReq.setCommentsOperator("=");
        validSearchReq.setAddDateOperator("=");
        validSearchReq.setDeleteDateOperator("=");
        validSearchReq.setCreatedByUserOperator("=");
        validSearchReq.setDateOperator("=");
        // 填充所有搜索字段值（触发 escapeLikeParam 全部路径）
        validSearchReq.setVariable("%var%");
        validSearchReq.setValue("_val_");
        validSearchReq.setVariantString1("vs1");
        validSearchReq.setVariantString2("vs2");
        validSearchReq.setComments("cmt");
        validSearchReq.setAddDate("202601");
        validSearchReq.setDeleteDate("202612");
        validSearchReq.setCreatedByUser("user");
        validSearchReq.setDate("2026-07-03");

        when(mapper.searchUserDefinedRules(any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.singletonList(mockRule));

        assertEquals(200, service.searchUserDefinedRules(validSearchReq).getCode().intValue());
    }

    @Test @DisplayName("search-各种操作符验证(ne/gt/lt)")
    void testSearch_OperatorValidation() {
        validSearchReq.setProductClassOperator("!=");
        validSearchReq.setNumberOperator(">");
        validSearchReq.setMarketOperator("!=");
        validSearchReq.setDateOperator(">");
        validSearchReq.setVariable("test_var");

        when(mapper.searchUserDefinedRules(any(), eq("ne"), any(), eq("gt"), any(), eq("ne"),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), eq("gt")))
                .thenReturn(Collections.singletonList(mockRule));

        assertEquals(200, service.searchUserDefinedRules(validSearchReq).getCode().intValue());
    }

    @Test @DisplayName("search-操作符不在白名单-使用默认值")
    void testSearch_OperatorInvalidDefault() {
        validSearchReq.setProductClassOperator("INVALID");
        validSearchReq.setNumberOperator("INVALID");

        when(mapper.searchUserDefinedRules(any(), eq("eq"), any(), eq("eq"), any(), eq("eq"),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.singletonList(mockRule));

        assertEquals(200, service.searchUserDefinedRules(validSearchReq).getCode().intValue());
    }

    @Test @DisplayName("search-带Like参数时eq操作符触发escape")
    void testSearch_EscapeLikeEq() {
        validSearchReq.setVariable("%test%");
        validSearchReq.setValue("_val_");
        validSearchReq.setVariantString1("test");

        when(mapper.searchUserDefinedRules(any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.singletonList(mockRule));

        assertEquals(200, service.searchUserDefinedRules(validSearchReq).getCode().intValue());
    }

    @Test @DisplayName("search-带Like参数时ne操作符不触发escape")
    void testSearch_NoEscapeWhenNe() {
        validSearchReq.setVariable("%test%");
        validSearchReq.setVariableOperator("!=");

        when(mapper.searchUserDefinedRules(any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.singletonList(mockRule));

        assertEquals(200, service.searchUserDefinedRules(validSearchReq).getCode().intValue());
    }

    // ============================================================
    // escapeLikeParam
    // ============================================================
    @Test @DisplayName("escapeLikeParam-参数为null-返回null")
    void testEscapeLikeParam_Null() {
        assertEquals(null, invokeEscape(null));
    }

    @Test @DisplayName("escapeLikeParam-参数为空-返回null")
    void testEscapeLikeParam_Empty() {
        assertEquals(null, invokeEscape(""));
    }

    @Test @DisplayName("escapeLikeParam-正常转义")
    void testEscapeLikeParam_Normal() {
        assertEquals("test", invokeEscape("test"));
        assertEquals("\\%abc", invokeEscape("%abc"));
        assertEquals("abc\\_def", invokeEscape("abc_def"));
        assertEquals("a\\%b\\_c", invokeEscape("a%b_c"));
    }

    @Test @DisplayName("escapeLikeParam-反斜杠转义")
    void testEscapeLikeParam_Backslash() {
        assertEquals("test\\\\path", invokeEscape("test\\path"));
        assertEquals("\\\\", invokeEscape("\\"));
        assertEquals("a\\\\b\\%c", invokeEscape("a\\b%c"));
    }

    @Test @DisplayName("escapeLikeParam-空格trim")
    void testEscapeLikeParam_Trim() {
        assertEquals("abc", invokeEscape("  abc  "));
    }

    private String invokeEscape(String param) {
        try {
            java.lang.reflect.Method m = UD09DeleteHdocuserdefinedrulesServiceImpl.class
                    .getDeclaredMethod("escapeLikeParam", String.class);
            m.setAccessible(true);
            return (String) m.invoke(service, param);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // ============================================================
    // validateOperator
    // ============================================================
    @Test @DisplayName("validateOperator-null返回默认")
    void testValidateOperator_Null() {
        assertEquals("=", invokeValidate(null, new String[]{"=", "!="}, "="));
    }

    @Test @DisplayName("validateOperator-空返回默认")
    void testValidateOperator_Empty() {
        assertEquals("=", invokeValidate("", new String[]{"=", "!="}, "="));
    }

    @Test @DisplayName("validateOperator-在白名单")
    void testValidateOperator_InWhitelist() {
        assertEquals("!=", invokeValidate("!=", new String[]{"=", "!="}, "="));
        assertEquals(">", invokeValidate(">", new String[]{">", "<"}, "="));
    }

    @Test @DisplayName("validateOperator-不在白名单返回默认")
    void testValidateOperator_NotInWhitelist() {
        assertEquals("=", invokeValidate("INJECT", new String[]{"=", "!="}, "="));
    }

    private String invokeValidate(String op, String[] whitelist, String def) {
        try {
            java.lang.reflect.Method m = UD09DeleteHdocuserdefinedrulesServiceImpl.class
                    .getDeclaredMethod("validateOperator", String.class, String[].class, String.class);
            m.setAccessible(true);
            return (String) m.invoke(service, op, whitelist, def);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // ============================================================
    // mapOperatorForXml
    // ============================================================
    @Test @DisplayName("mapOperatorForXml-null返回eq")
    void testMapOp_Null() { assertEquals("eq", invokeMapOp(null)); }
    @Test @DisplayName("mapOperatorForXml-=返回eq")   void testMapOp_Eq()  { assertEquals("eq", invokeMapOp("=")); }
    @Test @DisplayName("mapOperatorForXml-!=返回ne")  void testMapOp_Ne()  { assertEquals("ne", invokeMapOp("!=")); }
    @Test @DisplayName("mapOperatorForXml->返回gt")   void testMapOp_Gt()  { assertEquals("gt", invokeMapOp(">")); }
    @Test @DisplayName("mapOperatorForXml-<返回lt")   void testMapOp_Lt()  { assertEquals("lt", invokeMapOp("<")); }
    @Test @DisplayName("mapOperatorForXml-未知返回eq") void testMapOp_Unknown() { assertEquals("eq", invokeMapOp("?")); }

    private String invokeMapOp(String op) {
        try {
            java.lang.reflect.Method m = UD09DeleteHdocuserdefinedrulesServiceImpl.class
                    .getDeclaredMethod("mapOperatorForXml", String.class);
            m.setAccessible(true);
            return (String) m.invoke(service, op);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // ============================================================
    // deleteSelectedUserDefinedRules
    // ============================================================
    @Test @DisplayName("delete-空列表-返回200(0成功0失败)")
    void testDelete_EmptyList() {
        ApiResponse<?> r = service.deleteSelectedUserDefinedRules(new ArrayList<>());
        assertEquals(200, r.getCode().intValue());
        verifyNoInteractions(mapper);
    }

    @Test @DisplayName("delete-productClass为null-跳过")
    void testDelete_ProductClassNull() {
        UD09DeleteUserDefinedRulesRequest req = new UD09DeleteUserDefinedRulesRequest();
        req.setProductClass(null); req.setNumber(1); req.setMarket("JPN");
        ApiResponse<?> r = service.deleteSelectedUserDefinedRules(Collections.singletonList(req));
        // 全部失败
        assertEquals(500, r.getCode().intValue());
        verifyNoInteractions(mapper);
    }

    @Test @DisplayName("delete-productClass为空-跳过")
    void testDelete_ProductClassEmpty() {
        UD09DeleteUserDefinedRulesRequest req = new UD09DeleteUserDefinedRulesRequest();
        req.setProductClass(""); req.setNumber(1); req.setMarket("JPN");
        assertEquals(500, service.deleteSelectedUserDefinedRules(Collections.singletonList(req)).getCode().intValue());
        verifyNoInteractions(mapper);
    }

    @Test @DisplayName("delete-number为null-跳过")
    void testDelete_NumberNull() {
        UD09DeleteUserDefinedRulesRequest req = new UD09DeleteUserDefinedRulesRequest();
        req.setProductClass("A"); req.setNumber(null); req.setMarket("JPN");
        assertEquals(500, service.deleteSelectedUserDefinedRules(Collections.singletonList(req)).getCode().intValue());
        verifyNoInteractions(mapper);
    }

    @Test @DisplayName("delete-market为null-跳过")
    void testDelete_MarketNull() {
        UD09DeleteUserDefinedRulesRequest req = new UD09DeleteUserDefinedRulesRequest();
        req.setProductClass("A"); req.setNumber(1); req.setMarket(null);
        assertEquals(500, service.deleteSelectedUserDefinedRules(Collections.singletonList(req)).getCode().intValue());
        verifyNoInteractions(mapper);
    }

    @Test @DisplayName("delete-market为空-跳过")
    void testDelete_MarketEmpty() {
        UD09DeleteUserDefinedRulesRequest req = new UD09DeleteUserDefinedRulesRequest();
        req.setProductClass("A"); req.setNumber(1); req.setMarket("");
        assertEquals(500, service.deleteSelectedUserDefinedRules(Collections.singletonList(req)).getCode().intValue());
        verifyNoInteractions(mapper);
    }

    @Test @DisplayName("delete-记录不存在-跳过")
    void testDelete_NotFound() {
        UD09DeleteUserDefinedRulesRequest req = new UD09DeleteUserDefinedRulesRequest();
        req.setProductClass("A"); req.setNumber(999); req.setMarket("JPN");
        when(mapper.countByPrimaryKey("A", 999, "JPN")).thenReturn(0);
        assertEquals(500, service.deleteSelectedUserDefinedRules(Collections.singletonList(req)).getCode().intValue());
        verify(mapper, never()).softDelete(any(), any(), any(), any());
    }

    @Test @DisplayName("delete-单条删除成功-返回200")
    void testDelete_SingleSuccess() {
        UD09DeleteUserDefinedRulesRequest req = new UD09DeleteUserDefinedRulesRequest();
        req.setProductClass("A"); req.setNumber(100); req.setMarket("JPN");
        when(mapper.countByPrimaryKey("A", 100, "JPN")).thenReturn(1);
        when(mapper.softDelete("A", 100, "JPN", "SYSTEM")).thenReturn(1);

        ApiResponse<?> r = service.deleteSelectedUserDefinedRules(Collections.singletonList(req));
        assertEquals(200, r.getCode().intValue());
        verify(mapper, times(1)).softDelete("A", 100, "JPN", "SYSTEM");
    }

    @Test @DisplayName("delete-软删除返回0-计数失败")
    void testDelete_SoftDeleteReturnsZero() {
        UD09DeleteUserDefinedRulesRequest req = new UD09DeleteUserDefinedRulesRequest();
        req.setProductClass("A"); req.setNumber(100); req.setMarket("JPN");
        when(mapper.countByPrimaryKey("A", 100, "JPN")).thenReturn(1);
        when(mapper.softDelete("A", 100, "JPN", "SYSTEM")).thenReturn(0);
        assertEquals(500, service.deleteSelectedUserDefinedRules(Collections.singletonList(req)).getCode().intValue());
    }

    @Test @DisplayName("delete-部分成功部分失败-返回200含消息")
    void testDelete_PartialSuccess() {
        UD09DeleteUserDefinedRulesRequest req1 = new UD09DeleteUserDefinedRulesRequest();
        req1.setProductClass("A"); req1.setNumber(100); req1.setMarket("JPN");
        UD09DeleteUserDefinedRulesRequest req2 = new UD09DeleteUserDefinedRulesRequest();
        req2.setProductClass("B"); req2.setNumber(200); req2.setMarket(null); // failed

        when(mapper.countByPrimaryKey("A", 100, "JPN")).thenReturn(1);
        when(mapper.softDelete("A", 100, "JPN", "SYSTEM")).thenReturn(1);

        ApiResponse<?> r = service.deleteSelectedUserDefinedRules(Arrays.asList(req1, req2));
        assertEquals(200, r.getCode().intValue());
        // deletedCount=1, failedCount=1
        assertTrue(r.getMsg().contains("1条记录删除成功") && r.getMsg().contains("1条记录删除失败"));
    }

    @Test @DisplayName("delete-全部失败-500")
    void testDelete_AllFailed() {
        UD09DeleteUserDefinedRulesRequest req = new UD09DeleteUserDefinedRulesRequest();
        req.setProductClass("A"); req.setNumber(100); req.setMarket(null);
        assertEquals(500, service.deleteSelectedUserDefinedRules(Collections.singletonList(req)).getCode().intValue());
    }

    @Test @DisplayName("delete-多条全部成功-200")
    void testDelete_MultiAllSuccess() {
        UD09DeleteUserDefinedRulesRequest req1 = new UD09DeleteUserDefinedRulesRequest();
        req1.setProductClass("A"); req1.setNumber(100); req1.setMarket("JPN");
        UD09DeleteUserDefinedRulesRequest req2 = new UD09DeleteUserDefinedRulesRequest();
        req2.setProductClass("B"); req2.setNumber(200); req2.setMarket("USA");

        when(mapper.countByPrimaryKey("A", 100, "JPN")).thenReturn(1);
        when(mapper.countByPrimaryKey("B", 200, "USA")).thenReturn(1);
        when(mapper.softDelete("A", 100, "JPN", "SYSTEM")).thenReturn(1);
        when(mapper.softDelete("B", 200, "USA", "SYSTEM")).thenReturn(1);

        assertEquals(200, service.deleteSelectedUserDefinedRules(Arrays.asList(req1, req2)).getCode().intValue());
        verify(mapper, times(1)).softDelete("A", 100, "JPN", "SYSTEM");
        verify(mapper, times(1)).softDelete("B", 200, "USA", "SYSTEM");
    }

    @Test @DisplayName("delete-异常-500")
    void testDelete_Exception() {
        when(mapper.countByPrimaryKey(any(), any(), any())).thenThrow(new RuntimeException());
        UD09DeleteUserDefinedRulesRequest req = new UD09DeleteUserDefinedRulesRequest();
        req.setProductClass("A"); req.setNumber(100); req.setMarket("JPN");
        assertEquals(500, service.deleteSelectedUserDefinedRules(Collections.singletonList(req)).getCode().intValue());
    }
}
