package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocUserDefinedRules;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.service.impl.UD08HomologationVariablesServiceImpl;
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

import org.mockito.ArgumentCaptor;

/**
 * UD08HomologationVariablesServiceImpl 单元测试
 * 覆盖所有分支（100%覆盖率）
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD08HomologationVariablesServiceImpl 单元测试")
class UD08HomologationVariablesServiceImplTest {

    @Mock
    private HdocUserDefinedRulesMapper mapper;

    @InjectMocks
    private UD08HomologationVariablesServiceImpl service;

    private HdocUserDefinedRules validRule;

    @BeforeEach
    void setUp() {
        reset(mapper);

        validRule = new HdocUserDefinedRules();
        validRule.setPc("A");
        validRule.setNum(123);
        validRule.setMarket("JPN");
        validRule.setVariable("TEST_VAR");
        validRule.setVal("TEST_VAL");
        validRule.setVs("VS1");
        validRule.setVs2("VS2");
        validRule.setComments("test");
        validRule.setAddDate("202607");
        validRule.setUserid("test_user");
    }

    // ============================================================
    // getProductClassMaster
    // ============================================================
    @Test @DisplayName("getProductClassMaster-有数据")
    void testGetProductClassMaster_Success() {
        when(mapper.selectProductClassMaster()).thenReturn(Arrays.asList(mock(com.web.app.domain.Entity.ProductClassMaster.class)));
        ApiResponse<?> r = service.getProductClassMaster();
        assertEquals(200, r.getCode().intValue());
        verify(mapper, times(1)).selectProductClassMaster();
    }

    @Test @DisplayName("getProductClassMaster-返回null")
    void testGetProductClassMaster_Null() {
        when(mapper.selectProductClassMaster()).thenReturn(null);
        ApiResponse<?> r = service.getProductClassMaster();
        assertEquals(200, r.getCode().intValue());
    }

    @Test @DisplayName("getProductClassMaster-返回空列表")
    void testGetProductClassMaster_Empty() {
        when(mapper.selectProductClassMaster()).thenReturn(new ArrayList<>());
        ApiResponse<?> r = service.getProductClassMaster();
        assertEquals(200, r.getCode().intValue());
    }

    @Test @DisplayName("getProductClassMaster-异常")
    void testGetProductClassMaster_Exception() {
        when(mapper.selectProductClassMaster()).thenThrow(new RuntimeException());
        ApiResponse<?> r = service.getProductClassMaster();
        assertEquals(500, r.getCode().intValue());
    }

    // ============================================================
    // getMarketMaster
    // ============================================================
    @Test @DisplayName("getMarketMaster-有数据")
    void testGetMarketMaster_Success() {
        when(mapper.selectMarketMaster()).thenReturn(Arrays.asList(mock(com.web.app.domain.Entity.MarketMaster.class)));
        ApiResponse<?> r = service.getMarketMaster();
        assertEquals(200, r.getCode().intValue());
    }

    @Test @DisplayName("getMarketMaster-返回null")
    void testGetMarketMaster_Null() {
        when(mapper.selectMarketMaster()).thenReturn(null);
        ApiResponse<?> r = service.getMarketMaster();
        assertEquals(200, r.getCode().intValue());
    }

    @Test @DisplayName("getMarketMaster-返回空列表")
    void testGetMarketMaster_Empty() {
        when(mapper.selectMarketMaster()).thenReturn(new ArrayList<>());
        ApiResponse<?> r = service.getMarketMaster();
        assertEquals(200, r.getCode().intValue());
    }

    @Test @DisplayName("getMarketMaster-异常")
    void testGetMarketMaster_Exception() {
        when(mapper.selectMarketMaster()).thenThrow(new RuntimeException());
        ApiResponse<?> r = service.getMarketMaster();
        assertEquals(500, r.getCode().intValue());
    }

    // ============================================================
    // getHdocVariables
    // ============================================================
    @Test @DisplayName("getHdocVariables-有数据")
    void testGetHdocVariables_Success() {
        when(mapper.selectHdocVariables()).thenReturn(Arrays.asList(mock(com.web.app.domain.Entity.HdocVariables.class)));
        ApiResponse<?> r = service.getHdocVariables();
        assertEquals(200, r.getCode().intValue());
    }

    @Test @DisplayName("getHdocVariables-返回null")
    void testGetHdocVariables_Null() {
        when(mapper.selectHdocVariables()).thenReturn(null);
        ApiResponse<?> r = service.getHdocVariables();
        assertEquals(200, r.getCode().intValue());
    }

    @Test @DisplayName("getHdocVariables-返回空列表")
    void testGetHdocVariables_Empty() {
        when(mapper.selectHdocVariables()).thenReturn(new ArrayList<>());
        ApiResponse<?> r = service.getHdocVariables();
        assertEquals(200, r.getCode().intValue());
    }

    @Test @DisplayName("getHdocVariables-异常")
    void testGetHdocVariables_Exception() {
        when(mapper.selectHdocVariables()).thenThrow(new RuntimeException());
        ApiResponse<?> r = service.getHdocVariables();
        assertEquals(500, r.getCode().intValue());
    }

    // ============================================================
    // addUserDefinedRule - 参数校验
    // ============================================================
    @Test @DisplayName("add-pc为null-400")
    void testAdd_PcNull() {
        validRule.setPc(null);
        assertEquals(400, service.addUserDefinedRule(validRule).getCode().intValue());
        verifyNoInteractions(mapper);
    }

    @Test @DisplayName("add-pc为空-400")
    void testAdd_PcEmpty() {
        validRule.setPc("");
        assertEquals(400, service.addUserDefinedRule(validRule).getCode().intValue());
        verifyNoInteractions(mapper);
    }

    @Test @DisplayName("add-num为null-400")
    void testAdd_NumNull() {
        validRule.setNum(null);
        assertEquals(400, service.addUserDefinedRule(validRule).getCode().intValue());
        verifyNoInteractions(mapper);
    }

    @Test @DisplayName("add-market为null-400")
    void testAdd_MarketNull() {
        validRule.setMarket(null);
        assertEquals(400, service.addUserDefinedRule(validRule).getCode().intValue());
        verifyNoInteractions(mapper);
    }

    @Test @DisplayName("add-market为空-400")
    void testAdd_MarketEmpty() {
        validRule.setMarket("");
        assertEquals(400, service.addUserDefinedRule(validRule).getCode().intValue());
        verifyNoInteractions(mapper);
    }

    @Test @DisplayName("add-vs超过100字符-400")
    void testAdd_VsTooLong() {
        validRule.setVs("A".repeat(101));
        assertEquals(400, service.addUserDefinedRule(validRule).getCode().intValue());
        verifyNoInteractions(mapper);
    }

    @Test @DisplayName("add-vs2超过100字符-400")
    void testAdd_Vs2TooLong() {
        validRule.setVs2("A".repeat(101));
        assertEquals(400, service.addUserDefinedRule(validRule).getCode().intValue());
        verifyNoInteractions(mapper);
    }

    @Test @DisplayName("add-variable超过20字符-400")
    void testAdd_VariableTooLong() {
        validRule.setVariable("A".repeat(21));
        assertEquals(400, service.addUserDefinedRule(validRule).getCode().intValue());
        verifyNoInteractions(mapper);
    }

    @Test @DisplayName("add-val超过200字符-400")
    void testAdd_ValTooLong() {
        validRule.setVal("A".repeat(201));
        assertEquals(400, service.addUserDefinedRule(validRule).getCode().intValue());
        verifyNoInteractions(mapper);
    }

    @Test @DisplayName("add-主键冲突-409")
    void testAdd_Conflict() {
        when(mapper.countByPrimaryKey("A", 123, "JPN")).thenReturn(1);
        ApiResponse<?> r = service.addUserDefinedRule(validRule);
        assertEquals(409, r.getCode().intValue());
        verify(mapper, times(1)).countByPrimaryKey("A", 123, "JPN");
        verify(mapper, never()).insert(any());
    }

    // ============================================================
    // addUserDefinedRule - 系统字段设置与插入
    // ============================================================
    @Test @DisplayName("add-success-addDate有值-userid有值")
    void testAdd_Success_WithAddDateAndUser() {
        when(mapper.countByPrimaryKey("A", 123, "JPN")).thenReturn(0);
        when(mapper.insert(any())).thenReturn(1);

        ApiResponse<?> r = service.addUserDefinedRule(validRule);
        assertEquals(200, r.getCode().intValue());

        ArgumentCaptor<HdocUserDefinedRules> captor = ArgumentCaptor.forClass(HdocUserDefinedRules.class);
        verify(mapper, times(1)).insert(captor.capture());
        HdocUserDefinedRules captured = captor.getValue();
        assertEquals("202607", captured.getAddDate());
        assertEquals("test_user", captured.getRegisterUser(), "registerUser should match");
        assertEquals("test_user", captured.getUpdateUser(), "updateUser should match");
    }

    @Test @DisplayName("add-success-addDate为null自动填充-userid为null用SYSTEM")
    void testAdd_Success_AddDateNull_UserNull() {
        validRule.setAddDate(null);
        validRule.setUserid(null);

        when(mapper.countByPrimaryKey("A", 123, "JPN")).thenReturn(0);
        when(mapper.insert(any())).thenReturn(1);

        ApiResponse<?> r = service.addUserDefinedRule(validRule);
        assertEquals(200, r.getCode().intValue());

        ArgumentCaptor<HdocUserDefinedRules> captor = ArgumentCaptor.forClass(HdocUserDefinedRules.class);
        verify(mapper, times(1)).insert(captor.capture());
        HdocUserDefinedRules captured = captor.getValue();
        assertNotNull(captured.getAddDate(), "addDate should be auto-filled");
        assertEquals("SYSTEM", captured.getRegisterUser(), "registerUser should be SYSTEM");
        assertEquals("SYSTEM", captured.getUpdateUser(), "updateUser should be SYSTEM");
    }

    @Test @DisplayName("add-success-addDate为空字符串自动填充")
    void testAdd_Success_AddDateEmpty() {
        validRule.setAddDate("");

        when(mapper.countByPrimaryKey("A", 123, "JPN")).thenReturn(0);
        when(mapper.insert(any())).thenReturn(1);

        ApiResponse<?> r = service.addUserDefinedRule(validRule);
        assertEquals(200, r.getCode().intValue());
    }

    @Test @DisplayName("add-insert返回0-500")
    void testAdd_InsertFails() {
        when(mapper.countByPrimaryKey("A", 123, "JPN")).thenReturn(0);
        when(mapper.insert(any())).thenReturn(0);

        ApiResponse<?> r = service.addUserDefinedRule(validRule);
        assertEquals(500, r.getCode().intValue());
    }

    @Test @DisplayName("add-异常-500")
    void testAdd_Exception() {
        when(mapper.countByPrimaryKey("A", 123, "JPN")).thenThrow(new RuntimeException());
        ApiResponse<?> r = service.addUserDefinedRule(validRule);
        assertEquals(500, r.getCode().intValue());
    }

    // ============================================================
    // updateUserDefinedRule - 参数校验
    // ============================================================
    @Test @DisplayName("update-pc为null-400") void testUpdate_PcNull() { validRule.setPc(null); assertEquals(400, service.updateUserDefinedRule(validRule).getCode().intValue()); verifyNoInteractions(mapper); }
    @Test @DisplayName("update-pc为空-400") void testUpdate_PcEmpty() { validRule.setPc(""); assertEquals(400, service.updateUserDefinedRule(validRule).getCode().intValue()); verifyNoInteractions(mapper); }
    @Test @DisplayName("update-num为null-400") void testUpdate_NumNull() { validRule.setNum(null); assertEquals(400, service.updateUserDefinedRule(validRule).getCode().intValue()); verifyNoInteractions(mapper); }
    @Test @DisplayName("update-market为null-400") void testUpdate_MarketNull() { validRule.setMarket(null); assertEquals(400, service.updateUserDefinedRule(validRule).getCode().intValue()); verifyNoInteractions(mapper); }
    @Test @DisplayName("update-market为空-400") void testUpdate_MarketEmpty() { validRule.setMarket(""); assertEquals(400, service.updateUserDefinedRule(validRule).getCode().intValue()); verifyNoInteractions(mapper); }
    @Test @DisplayName("update-vs超过100-400") void testUpdate_VsTooLong() { validRule.setVs("A".repeat(101)); assertEquals(400, service.updateUserDefinedRule(validRule).getCode().intValue()); verifyNoInteractions(mapper); }
    @Test @DisplayName("update-vs2超过100-400") void testUpdate_Vs2TooLong() { validRule.setVs2("A".repeat(101)); assertEquals(400, service.updateUserDefinedRule(validRule).getCode().intValue()); verifyNoInteractions(mapper); }
    @Test @DisplayName("update-variable超过20-400") void testUpdate_VariableTooLong() { validRule.setVariable("A".repeat(21)); assertEquals(400, service.updateUserDefinedRule(validRule).getCode().intValue()); verifyNoInteractions(mapper); }
    @Test @DisplayName("update-val超过200-400") void testUpdate_ValTooLong() { validRule.setVal("A".repeat(201)); assertEquals(400, service.updateUserDefinedRule(validRule).getCode().intValue()); verifyNoInteractions(mapper); }

    @Test @DisplayName("update-记录不存在-404")
    void testUpdate_NotFound() {
        when(mapper.countByPrimaryKey("A", 123, "JPN")).thenReturn(0);
        assertEquals(404, service.updateUserDefinedRule(validRule).getCode().intValue());
        verify(mapper, never()).update(any());
    }

    @Test @DisplayName("update-success-userid有值")
    void testUpdate_Success_WithUser() {
        when(mapper.countByPrimaryKey("A", 123, "JPN")).thenReturn(1);
        when(mapper.update(any())).thenReturn(1);

        ApiResponse<?> r = service.updateUserDefinedRule(validRule);
        assertEquals(200, r.getCode().intValue());

        ArgumentCaptor<HdocUserDefinedRules> captor = ArgumentCaptor.forClass(HdocUserDefinedRules.class);
        verify(mapper, times(1)).update(captor.capture());
        assertEquals("test_user", captor.getValue().getUpdateUser());
    }

    @Test @DisplayName("update-success-userid为null用SYSTEM")
    void testUpdate_Success_UserNull() {
        validRule.setUserid(null);
        when(mapper.countByPrimaryKey("A", 123, "JPN")).thenReturn(1);
        when(mapper.update(any())).thenReturn(1);

        ApiResponse<?> r = service.updateUserDefinedRule(validRule);
        assertEquals(200, r.getCode().intValue());

        ArgumentCaptor<HdocUserDefinedRules> captor = ArgumentCaptor.forClass(HdocUserDefinedRules.class);
        verify(mapper, times(1)).update(captor.capture());
        assertEquals("SYSTEM", captor.getValue().getUpdateUser());
    }

    @Test @DisplayName("update-update返回0-500")
    void testUpdate_UpdateFails() {
        when(mapper.countByPrimaryKey("A", 123, "JPN")).thenReturn(1);
        when(mapper.update(any())).thenReturn(0);
        assertEquals(500, service.updateUserDefinedRule(validRule).getCode().intValue());
    }

    @Test @DisplayName("update-异常-500")
    void testUpdate_Exception() {
        when(mapper.countByPrimaryKey("A", 123, "JPN")).thenThrow(new RuntimeException());
        assertEquals(500, service.updateUserDefinedRule(validRule).getCode().intValue());
    }

    // ============================================================
    // deleteUserDefinedRule
    // ============================================================
    @Test @DisplayName("delete-pc为null-400") void testDelete_PcNull() { assertEquals(400, service.deleteUserDefinedRule(null, 123, "JPN", "u").getCode().intValue()); verifyNoInteractions(mapper); }
    @Test @DisplayName("delete-pc为空-400") void testDelete_PcEmpty() { assertEquals(400, service.deleteUserDefinedRule("", 123, "JPN", "u").getCode().intValue()); verifyNoInteractions(mapper); }
    @Test @DisplayName("delete-num为null-400") void testDelete_NumNull() { assertEquals(400, service.deleteUserDefinedRule("A", null, "JPN", "u").getCode().intValue()); verifyNoInteractions(mapper); }
    @Test @DisplayName("delete-market为null-400") void testDelete_MarketNull() { assertEquals(400, service.deleteUserDefinedRule("A", 123, null, "u").getCode().intValue()); verifyNoInteractions(mapper); }
    @Test @DisplayName("delete-market为空-400") void testDelete_MarketEmpty() { assertEquals(400, service.deleteUserDefinedRule("A", 123, "", "u").getCode().intValue()); verifyNoInteractions(mapper); }

    @Test @DisplayName("delete-记录不存在-404")
    void testDelete_NotFound() {
        when(mapper.countByPrimaryKey("A", 123, "JPN")).thenReturn(0);
        assertEquals(404, service.deleteUserDefinedRule("A", 123, "JPN", "u").getCode().intValue());
        verify(mapper, never()).softDelete(any(), any(), any(), any());
    }

    @Test @DisplayName("delete-success-updateUser有值")
    void testDelete_Success_WithUser() {
        when(mapper.countByPrimaryKey("A", 123, "JPN")).thenReturn(1);
        when(mapper.softDelete("A", 123, "JPN", "test_user")).thenReturn(1);

        assertEquals(200, service.deleteUserDefinedRule("A", 123, "JPN", "test_user").getCode().intValue());
        verify(mapper, times(1)).softDelete("A", 123, "JPN", "test_user");
    }

    @Test @DisplayName("delete-success-updateUser为null用SYSTEM")
    void testDelete_Success_UserNull() {
        when(mapper.countByPrimaryKey("A", 123, "JPN")).thenReturn(1);
        when(mapper.softDelete("A", 123, "JPN", "SYSTEM")).thenReturn(1);

        assertEquals(200, service.deleteUserDefinedRule("A", 123, "JPN", null).getCode().intValue());
        verify(mapper, times(1)).softDelete("A", 123, "JPN", "SYSTEM");
    }

    @Test @DisplayName("delete-softDelete返回0-500")
    void testDelete_DeleteFails() {
        when(mapper.countByPrimaryKey("A", 123, "JPN")).thenReturn(1);
        when(mapper.softDelete("A", 123, "JPN", "SYSTEM")).thenReturn(0);

        assertEquals(500, service.deleteUserDefinedRule("A", 123, "JPN", null).getCode().intValue());
    }

    @Test @DisplayName("delete-异常-500")
    void testDelete_Exception() {
        when(mapper.countByPrimaryKey("A", 123, "JPN")).thenThrow(new RuntimeException());
        assertEquals(500, service.deleteUserDefinedRule("A", 123, "JPN", "u").getCode().intValue());
    }
}
