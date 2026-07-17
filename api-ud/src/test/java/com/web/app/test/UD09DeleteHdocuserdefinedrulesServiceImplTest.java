package com.web.app.test;

import com.web.app.dto.UD09DeleteHdocuserdefinedrulesRequest;
import com.web.app.dto.UD09DeleteHdocuserdefinedrulesResponse;
import com.web.app.entity.HdocUserDefinedRules;
import com.web.app.mapper.UD09DeleteHdocuserdefinedrulesMapper;
import com.web.app.service.impl.UD09DeleteHdocuserdefinedrulesServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD09DeleteHdocuserdefinedrulesServiceImpl 单元测试
 * 覆盖 UD09Seach 和 UD09DeleteSelected 所有分支，达到 100% JaCoCo 覆盖率
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD09DeleteHdocuserdefinedrulesServiceImpl 单元测试")
class UD09DeleteHdocuserdefinedrulesServiceImplTest {

    @Mock
    private UD09DeleteHdocuserdefinedrulesMapper ud09Mapper;

    @InjectMocks
    private UD09DeleteHdocuserdefinedrulesServiceImpl service;

    // ====================================================================
    // UD09Seach 测试
    // ====================================================================

    @Test
    @DisplayName("[Seach] ruleList 为 null 时应返回404")
    void testSeach_RuleListNull() {
        when(ud09Mapper.searchUserDefinedRules(any())).thenReturn(null);

        UD09DeleteHdocuserdefinedrulesRequest request = new UD09DeleteHdocuserdefinedrulesRequest();
        UD09DeleteHdocuserdefinedrulesResponse response = service.UD09Seach(request);

        assertEquals(404, response.getCode());
        assertEquals("数据不存在", response.getMessage());
        assertNull(response.getData());
        verify(ud09Mapper, times(1)).searchUserDefinedRules(request);
    }

    @Test
    @DisplayName("[Seach] ruleList 为空列表时应返回404")
    void testSeach_RuleListEmpty() {
        when(ud09Mapper.searchUserDefinedRules(any())).thenReturn(Collections.emptyList());

        UD09DeleteHdocuserdefinedrulesRequest request = new UD09DeleteHdocuserdefinedrulesRequest();
        UD09DeleteHdocuserdefinedrulesResponse response = service.UD09Seach(request);

        assertEquals(404, response.getCode());
        assertEquals("数据不存在", response.getMessage());
        assertNull(response.getData());
        verify(ud09Mapper, times(1)).searchUserDefinedRules(request);
    }

    @Test
    @DisplayName("[Seach] 查询成功且 registerDatetime 不为 null 时应返回日期字符串")
    void testSeach_SuccessWithRegisterDatetime() {
        LocalDateTime now = LocalDateTime.of(2026, 6, 24, 10, 0, 0);
        HdocUserDefinedRules rule = createRule(now);

        when(ud09Mapper.searchUserDefinedRules(any()))
                .thenReturn(Collections.singletonList(rule));

        UD09DeleteHdocuserdefinedrulesRequest request = new UD09DeleteHdocuserdefinedrulesRequest();
        UD09DeleteHdocuserdefinedrulesResponse response = service.UD09Seach(request);

        assertEquals(200, response.getCode());
        assertNotNull(response.getData());

        @SuppressWarnings("unchecked")
        List<UD09DeleteHdocuserdefinedrulesResponse.UserDefinedRuleData> dataList = (List<UD09DeleteHdocuserdefinedrulesResponse.UserDefinedRuleData>) response
                .getData();
        assertEquals(1, dataList.size());

        UD09DeleteHdocuserdefinedrulesResponse.UserDefinedRuleData data = dataList.get(0);
        assertEquals("A1", data.getProductClass());
        assertEquals(Long.valueOf(1L), data.getNumber());
        assertEquals("JP", data.getMarket());
        assertEquals("VAR001", data.getVariable());
        assertEquals("VALUE001", data.getValue());
        assertEquals("VS001", data.getVariantString1());
        assertEquals("VS002", data.getVariantString2());
        assertEquals("备注", data.getComments());
        assertEquals("202606", data.getAddDate());
        assertEquals("", data.getDeleteDate());
        assertEquals("admin", data.getCreatedByUser());
        assertEquals("2026-06-24T10:00", data.getDate());
        verify(ud09Mapper, times(1)).searchUserDefinedRules(request);
    }

    @Test
    @DisplayName("[Seach] 查询成功且 registerDatetime 为 null 时应返回 null date")
    void testSeach_SuccessWithRegisterDatetimeNull() {
        HdocUserDefinedRules rule = createRule(null);

        when(ud09Mapper.searchUserDefinedRules(any()))
                .thenReturn(Collections.singletonList(rule));

        UD09DeleteHdocuserdefinedrulesRequest request = new UD09DeleteHdocuserdefinedrulesRequest();
        UD09DeleteHdocuserdefinedrulesResponse response = service.UD09Seach(request);

        assertEquals(200, response.getCode());
        @SuppressWarnings("unchecked")
        List<UD09DeleteHdocuserdefinedrulesResponse.UserDefinedRuleData> dataList = (List<UD09DeleteHdocuserdefinedrulesResponse.UserDefinedRuleData>) response
                .getData();
        assertEquals(1, dataList.size());
        assertNull(dataList.get(0).getDate());
        verify(ud09Mapper, times(1)).searchUserDefinedRules(request);
    }

    @Test
    @DisplayName("[Seach] 查询成功且返回多条记录")
    void testSeach_SuccessMultipleRecords() {
        HdocUserDefinedRules rule1 = createRule(LocalDateTime.now());
        HdocUserDefinedRules rule2 = createRule(LocalDateTime.now());
        rule2.setPc("B2");
        rule2.setNum(2L);

        when(ud09Mapper.searchUserDefinedRules(any()))
                .thenReturn(Arrays.asList(rule1, rule2));

        UD09DeleteHdocuserdefinedrulesRequest request = new UD09DeleteHdocuserdefinedrulesRequest();
        UD09DeleteHdocuserdefinedrulesResponse response = service.UD09Seach(request);

        assertEquals(200, response.getCode());
        @SuppressWarnings("unchecked")
        List<UD09DeleteHdocuserdefinedrulesResponse.UserDefinedRuleData> dataList = (List<UD09DeleteHdocuserdefinedrulesResponse.UserDefinedRuleData>) response
                .getData();
        assertEquals(2, dataList.size());
        assertEquals("A1", dataList.get(0).getProductClass());
        assertEquals("B2", dataList.get(1).getProductClass());
        verify(ud09Mapper, times(1)).searchUserDefinedRules(request);
    }

    @Test
    @DisplayName("[Seach] 系统异常时应返回500")
    void testSeach_Exception() {
        when(ud09Mapper.searchUserDefinedRules(any()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD09DeleteHdocuserdefinedrulesRequest request = new UD09DeleteHdocuserdefinedrulesRequest();
        UD09DeleteHdocuserdefinedrulesResponse response = service.UD09Seach(request);

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMessage());
        assertNull(response.getData());
        verify(ud09Mapper, times(1)).searchUserDefinedRules(request);
    }

    // ====================================================================
    // UD09DeleteSelected 测试
    // ====================================================================

    @Test
    @DisplayName("[DeleteSelected] productClass 为 null 时应返回400")
    void testDeleteSelected_ProductClassNull() {
        UD09DeleteHdocuserdefinedrulesRequest request = new UD09DeleteHdocuserdefinedrulesRequest();
        request.setProductClass(null);
        request.setNumber(1);
        request.setMarket("JP");

        UD09DeleteHdocuserdefinedrulesResponse response = service.UD09DeleteSelected(request);

        assertEquals(400, response.getCode());
        assertEquals("参数productClass、number、market不能为空", response.getMessage());
        assertNull(response.getData());
        verify(ud09Mapper, never()).countUserDefinedRule(any(), any(), any());
    }

    @Test
    @DisplayName("[DeleteSelected] productClass 为空字符串时应返回400")
    void testDeleteSelected_ProductClassEmpty() {
        UD09DeleteHdocuserdefinedrulesRequest request = new UD09DeleteHdocuserdefinedrulesRequest();
        request.setProductClass("");
        request.setNumber(1);
        request.setMarket("JP");

        UD09DeleteHdocuserdefinedrulesResponse response = service.UD09DeleteSelected(request);

        assertEquals(400, response.getCode());
        assertEquals("参数productClass、number、market不能为空", response.getMessage());
        verify(ud09Mapper, never()).countUserDefinedRule(any(), any(), any());
    }

    @Test
    @DisplayName("[DeleteSelected] number 为 null 时应返回400")
    void testDeleteSelected_NumberNull() {
        UD09DeleteHdocuserdefinedrulesRequest request = new UD09DeleteHdocuserdefinedrulesRequest();
        request.setProductClass("A1");
        request.setNumber(null);
        request.setMarket("JP");

        UD09DeleteHdocuserdefinedrulesResponse response = service.UD09DeleteSelected(request);

        assertEquals(400, response.getCode());
        assertEquals("参数productClass、number、market不能为空", response.getMessage());
        verify(ud09Mapper, never()).countUserDefinedRule(any(), any(), any());
    }

    @Test
    @DisplayName("[DeleteSelected] market 为 null 时应返回400")
    void testDeleteSelected_MarketNull() {
        UD09DeleteHdocuserdefinedrulesRequest request = new UD09DeleteHdocuserdefinedrulesRequest();
        request.setProductClass("A1");
        request.setNumber(1);
        request.setMarket(null);

        UD09DeleteHdocuserdefinedrulesResponse response = service.UD09DeleteSelected(request);

        assertEquals(400, response.getCode());
        assertEquals("参数productClass、number、market不能为空", response.getMessage());
        verify(ud09Mapper, never()).countUserDefinedRule(any(), any(), any());
    }

    @Test
    @DisplayName("[DeleteSelected] market 为空字符串时应返回400")
    void testDeleteSelected_MarketEmpty() {
        UD09DeleteHdocuserdefinedrulesRequest request = new UD09DeleteHdocuserdefinedrulesRequest();
        request.setProductClass("A1");
        request.setNumber(1);
        request.setMarket("");

        UD09DeleteHdocuserdefinedrulesResponse response = service.UD09DeleteSelected(request);

        assertEquals(400, response.getCode());
        assertEquals("参数productClass、number、market不能为空", response.getMessage());
        verify(ud09Mapper, never()).countUserDefinedRule(any(), any(), any());
    }

    @Test
    @DisplayName("[DeleteSelected] count 为 null 时应返回400")
    void testDeleteSelected_CountNull() {
        when(ud09Mapper.countUserDefinedRule("A1", 1, "JP")).thenReturn(null);

        UD09DeleteHdocuserdefinedrulesRequest request = new UD09DeleteHdocuserdefinedrulesRequest();
        request.setProductClass("A1");
        request.setNumber(1);
        request.setMarket("JP");

        UD09DeleteHdocuserdefinedrulesResponse response = service.UD09DeleteSelected(request);

        assertEquals(400, response.getCode());
        assertEquals("数据不存在", response.getMessage());
        assertNull(response.getData());
        verify(ud09Mapper, times(1)).countUserDefinedRule("A1", 1, "JP");
        verify(ud09Mapper, never()).deleteUserDefinedRule(any(), any(), any());
    }

    @Test
    @DisplayName("[DeleteSelected] count 为 0 时应返回400")
    void testDeleteSelected_CountZero() {
        when(ud09Mapper.countUserDefinedRule("A1", 1, "JP")).thenReturn(0);

        UD09DeleteHdocuserdefinedrulesRequest request = new UD09DeleteHdocuserdefinedrulesRequest();
        request.setProductClass("A1");
        request.setNumber(1);
        request.setMarket("JP");

        UD09DeleteHdocuserdefinedrulesResponse response = service.UD09DeleteSelected(request);

        assertEquals(400, response.getCode());
        assertEquals("数据不存在", response.getMessage());
        assertNull(response.getData());
        verify(ud09Mapper, times(1)).countUserDefinedRule("A1", 1, "JP");
        verify(ud09Mapper, never()).deleteUserDefinedRule(any(), any(), any());
    }

    @Test
    @DisplayName("[DeleteSelected] 删除成功时应返回200")
    void testDeleteSelected_Success() {
        when(ud09Mapper.countUserDefinedRule("A1", 1, "JP")).thenReturn(1);

        UD09DeleteHdocuserdefinedrulesRequest request = new UD09DeleteHdocuserdefinedrulesRequest();
        request.setProductClass("A1");
        request.setNumber(1);
        request.setMarket("JP");

        UD09DeleteHdocuserdefinedrulesResponse response = service.UD09DeleteSelected(request);

        assertEquals(200, response.getCode());
        assertEquals("", response.getMessage());
        assertNull(response.getData());
        verify(ud09Mapper, times(1)).countUserDefinedRule("A1", 1, "JP");
        verify(ud09Mapper, times(1)).deleteUserDefinedRule("A1", 1, "JP");
    }

    @Test
    @DisplayName("[DeleteSelected] 系统异常时应返回500")
    void testDeleteSelected_Exception() {
        when(ud09Mapper.countUserDefinedRule(anyString(), anyInt(), anyString()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD09DeleteHdocuserdefinedrulesRequest request = new UD09DeleteHdocuserdefinedrulesRequest();
        request.setProductClass("A1");
        request.setNumber(1);
        request.setMarket("JP");

        UD09DeleteHdocuserdefinedrulesResponse response = service.UD09DeleteSelected(request);

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMessage());
        assertNull(response.getData());
        verify(ud09Mapper, times(1)).countUserDefinedRule("A1", 1, "JP");
    }

    // ==================== 辅助方法 ====================

    private HdocUserDefinedRules createRule(LocalDateTime registerDatetime) {
        HdocUserDefinedRules rule = new HdocUserDefinedRules();
        rule.setPc("A1");
        rule.setNum(1L);
        rule.setMarket("JP");
        rule.setVariable("VAR001");
        rule.setVal("VALUE001");
        rule.setVs("VS001");
        rule.setVs2("VS002");
        rule.setComments("备注");
        rule.setAddDate("202606");
        rule.setDeleteDate("");
        rule.setRegisterUser("admin");
        rule.setRegisterDatetime(registerDatetime);
        return rule;
    }
}
