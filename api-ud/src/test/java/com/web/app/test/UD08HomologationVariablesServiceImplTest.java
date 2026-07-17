package com.web.app.test;

import com.web.app.dto.UD08HomologationVariablesRequest;
import com.web.app.dto.UD08HomologationVariablesResponse;
import com.web.app.entity.HdocUserDefinedRules;
import com.web.app.entity.MarketMaster;
import com.web.app.entity.ProductClassMaster;
import com.web.app.mapper.UD08HomologationVariablesMapper;
import com.web.app.service.impl.UD08HomologationVariablesServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD08HomologationVariablesServiceImpl 单元测试
 * 覆盖 6 个业务方法的所有分支，达到 100% JaCoCo 覆盖率
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD08HomologationVariablesServiceImpl 单元测试")
class UD08HomologationVariablesServiceImplTest {

    @Mock
    private UD08HomologationVariablesMapper ud08Mapper;

    @InjectMocks
    private UD08HomologationVariablesServiceImpl service;

    // ====================================================================
    // UD08SelectProductclassmaster 测试
    // ====================================================================

    @Test
    @DisplayName("[SelectProductclassmaster] list 不为 null 时应成功返回产品类别列表")
    void testSelectProductclassmaster_ListNotNull() {
        ProductClassMaster pcm1 = new ProductClassMaster();
        pcm1.setPc("A1");
        ProductClassMaster pcm2 = new ProductClassMaster();
        pcm2.setPc("B2");
        when(ud08Mapper.selectAllProductClass()).thenReturn(Arrays.asList(pcm1, pcm2));

        UD08HomologationVariablesResponse response = service.UD08SelectProductclassmaster();

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMessage());
        assertNotNull(response.getData());
        @SuppressWarnings("unchecked")
        List<UD08HomologationVariablesResponse.ProductClassData> dataList = (List<UD08HomologationVariablesResponse.ProductClassData>) response
                .getData();
        assertEquals(2, dataList.size());
        assertEquals("A1", dataList.get(0).getPc());
        assertEquals("B2", dataList.get(1).getPc());
        verify(ud08Mapper, times(1)).selectAllProductClass();
    }

    @Test
    @DisplayName("[SelectProductclassmaster] list 为 null 时应返回空列表")
    void testSelectProductclassmaster_ListNull() {
        when(ud08Mapper.selectAllProductClass()).thenReturn(null);

        UD08HomologationVariablesResponse response = service.UD08SelectProductclassmaster();

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMessage());
        assertNotNull(response.getData());
        @SuppressWarnings("unchecked")
        List<UD08HomologationVariablesResponse.ProductClassData> dataList = (List<UD08HomologationVariablesResponse.ProductClassData>) response
                .getData();
        assertTrue(dataList.isEmpty());
        verify(ud08Mapper, times(1)).selectAllProductClass();
    }

    @Test
    @DisplayName("[SelectProductclassmaster] 系统异常时应返回500")
    void testSelectProductclassmaster_Exception() {
        when(ud08Mapper.selectAllProductClass()).thenThrow(new RuntimeException("数据库异常"));

        UD08HomologationVariablesResponse response = service.UD08SelectProductclassmaster();

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMessage());
        assertNull(response.getData());
        verify(ud08Mapper, times(1)).selectAllProductClass();
    }

    // ====================================================================
    // UD08SelectMarketmaster 测试
    // ====================================================================

    @Test
    @DisplayName("[SelectMarketmaster] list 不为 null 时应成功返回市场列表")
    void testSelectMarketmaster_ListNotNull() {
        MarketMaster mm1 = new MarketMaster();
        mm1.setMarket("JP");
        MarketMaster mm2 = new MarketMaster();
        mm2.setMarket("AUS");
        when(ud08Mapper.selectAllMarket()).thenReturn(Arrays.asList(mm1, mm2));

        UD08HomologationVariablesResponse response = service.UD08SelectMarketmaster();

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMessage());
        assertNotNull(response.getData());
        @SuppressWarnings("unchecked")
        List<UD08HomologationVariablesResponse.MarketData> dataList = (List<UD08HomologationVariablesResponse.MarketData>) response
                .getData();
        assertEquals(2, dataList.size());
        assertEquals("JP", dataList.get(0).getMarket());
        assertEquals("AUS", dataList.get(1).getMarket());
        verify(ud08Mapper, times(1)).selectAllMarket();
    }

    @Test
    @DisplayName("[SelectMarketmaster] list 为 null 时应返回空列表")
    void testSelectMarketmaster_ListNull() {
        when(ud08Mapper.selectAllMarket()).thenReturn(null);

        UD08HomologationVariablesResponse response = service.UD08SelectMarketmaster();

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMessage());
        assertNotNull(response.getData());
        @SuppressWarnings("unchecked")
        List<UD08HomologationVariablesResponse.MarketData> dataList = (List<UD08HomologationVariablesResponse.MarketData>) response
                .getData();
        assertTrue(dataList.isEmpty());
        verify(ud08Mapper, times(1)).selectAllMarket();
    }

    @Test
    @DisplayName("[SelectMarketmaster] 系统异常时应返回500")
    void testSelectMarketmaster_Exception() {
        when(ud08Mapper.selectAllMarket()).thenThrow(new RuntimeException("数据库异常"));

        UD08HomologationVariablesResponse response = service.UD08SelectMarketmaster();

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMessage());
        assertNull(response.getData());
        verify(ud08Mapper, times(1)).selectAllMarket();
    }

    // ====================================================================
    // UD08SelectHdocvariables 测试
    // ====================================================================

    @Test
    @DisplayName("[SelectHdocvariables] variables 为 null 时应返回400")
    void testSelectHdocvariables_VariablesNull() {
        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setVariables(null);

        UD08HomologationVariablesResponse response = service.UD08SelectHdocvariables(request);

        assertEquals(400, response.getCode());
        assertEquals("参数variables不能为空", response.getMessage());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[SelectHdocvariables] variables 为空字符串时应返回400")
    void testSelectHdocvariables_VariablesEmpty() {
        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setVariables("   ");

        UD08HomologationVariablesResponse response = service.UD08SelectHdocvariables(request);

        assertEquals(400, response.getCode());
        assertEquals("参数variables不能为空", response.getMessage());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[SelectHdocvariables] count > 0 时应返回 exists=true")
    void testSelectHdocvariables_Exists() {
        when(ud08Mapper.countHdocVariables("VAR001")).thenReturn(5);

        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setVariables("VAR001");

        UD08HomologationVariablesResponse response = service.UD08SelectHdocvariables(request);

        assertEquals(200, response.getCode());
        assertEquals("数据存在", response.getMessage());
        assertNotNull(response.getData());
        @SuppressWarnings("unchecked")
        java.util.Map<String, Boolean> data = (java.util.Map<String, Boolean>) response.getData();
        assertTrue(data.get("exists"));
        verify(ud08Mapper, times(1)).countHdocVariables("VAR001");
    }

    @Test
    @DisplayName("[SelectHdocvariables] count 为 null 时应返回 exists=false")
    void testSelectHdocvariables_CountNull() {
        when(ud08Mapper.countHdocVariables("VAR001")).thenReturn(null);

        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setVariables("VAR001");

        UD08HomologationVariablesResponse response = service.UD08SelectHdocvariables(request);

        assertEquals(200, response.getCode());
        assertEquals("数据不存在", response.getMessage());
        @SuppressWarnings("unchecked")
        java.util.Map<String, Boolean> data = (java.util.Map<String, Boolean>) response.getData();
        assertFalse(data.get("exists"));
        verify(ud08Mapper, times(1)).countHdocVariables("VAR001");
    }

    @Test
    @DisplayName("[SelectHdocvariables] count = 0 时应返回 exists=false")
    void testSelectHdocvariables_CountZero() {
        when(ud08Mapper.countHdocVariables("VAR001")).thenReturn(0);

        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setVariables("VAR001");

        UD08HomologationVariablesResponse response = service.UD08SelectHdocvariables(request);

        assertEquals(200, response.getCode());
        assertEquals("数据不存在", response.getMessage());
        @SuppressWarnings("unchecked")
        java.util.Map<String, Boolean> data = (java.util.Map<String, Boolean>) response.getData();
        assertFalse(data.get("exists"));
        verify(ud08Mapper, times(1)).countHdocVariables("VAR001");
    }

    @Test
    @DisplayName("[SelectHdocvariables] 系统异常时应返回500")
    void testSelectHdocvariables_Exception() {
        when(ud08Mapper.countHdocVariables(anyString())).thenThrow(new RuntimeException("数据库异常"));

        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setVariables("VAR001");

        UD08HomologationVariablesResponse response = service.UD08SelectHdocvariables(request);

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMessage());
        assertNull(response.getData());
    }

    // ====================================================================
    // UD08Add 测试
    // ====================================================================

    @Test
    @DisplayName("[Add] productClass 为空时应返回400")
    void testAdd_ProductClassEmpty() {
        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass(null);
        request.setNumber(1L);
        request.setMarket("JP");

        UD08HomologationVariablesResponse response = service.UD08Add(request);

        assertEquals(400, response.getCode());
        assertEquals("productClass不能为空", response.getMessage());
    }

    @Test
    @DisplayName("[Add] productClass 为空字符串时应返回400")
    void testAdd_ProductClassEmptyString() {
        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("");
        request.setNumber(1L);
        request.setMarket("JP");

        UD08HomologationVariablesResponse response = service.UD08Add(request);

        assertEquals(400, response.getCode());
        assertEquals("productClass不能为空", response.getMessage());
    }

    @Test
    @DisplayName("[Add] number 为 null 时应返回400")
    void testAdd_NumberNull() {
        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(null);
        request.setMarket("JP");

        UD08HomologationVariablesResponse response = service.UD08Add(request);

        assertEquals(400, response.getCode());
        assertEquals("number不能为空", response.getMessage());
    }

    @Test
    @DisplayName("[Add] market 为 null 时应返回400")
    void testAdd_MarketNull() {
        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(1L);
        request.setMarket(null);

        UD08HomologationVariablesResponse response = service.UD08Add(request);

        assertEquals(400, response.getCode());
        assertEquals("market不能为空", response.getMessage());
    }

    @Test
    @DisplayName("[Add] market 为空字符串时应返回400")
    void testAdd_MarketEmptyString() {
        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(1L);
        request.setMarket("");

        UD08HomologationVariablesResponse response = service.UD08Add(request);

        assertEquals(400, response.getCode());
        assertEquals("market不能为空", response.getMessage());
    }

    @Test
    @DisplayName("[Add] count 为 null 时不应报主键冲突")
    void testAdd_CountNull() {
        when(ud08Mapper.countUserDefinedRule("A1", 1L, "JP")).thenReturn(null);

        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(1L);
        request.setMarket("JP");
        request.setCreatedByUser("admin");

        UD08HomologationVariablesResponse response = service.UD08Add(request);

        assertEquals(200, response.getCode());
        assertEquals("数据添加成功", response.getMessage());
        verify(ud08Mapper, times(1)).countUserDefinedRule("A1", 1L, "JP");
        verify(ud08Mapper, times(1)).insertUserDefinedRule(any());
    }

    @Test
    @DisplayName("[Add] 主键冲突（count > 0）时应返回409")
    void testAdd_PrimaryKeyConflict() {
        when(ud08Mapper.countUserDefinedRule("A1", 1L, "JP")).thenReturn(1);

        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(1L);
        request.setMarket("JP");

        UD08HomologationVariablesResponse response = service.UD08Add(request);

        assertEquals(409, response.getCode());
        assertEquals("Primary key conflict, Please enter the correct content", response.getMessage());
        verify(ud08Mapper, times(1)).countUserDefinedRule("A1", 1L, "JP");
        verify(ud08Mapper, never()).insertUserDefinedRule(any());
    }

    @Test
    @DisplayName("[Add] 添加成功时应返回200")
    void testAdd_Success() {
        when(ud08Mapper.countUserDefinedRule("A1", 1L, "JP")).thenReturn(0);

        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(1L);
        request.setMarket("JP");
        request.setVariable("VAR001");
        request.setValue("VALUE001");
        request.setVariantString1("VS001");
        request.setVariantString2("VS002");
        request.setComments("备注");
        request.setAddDate("202606");
        request.setDeleteDate("");
        request.setCreatedByUser("admin");

        UD08HomologationVariablesResponse response = service.UD08Add(request);

        assertEquals(200, response.getCode());
        assertEquals("数据添加成功", response.getMessage());

        ArgumentCaptor<HdocUserDefinedRules> captor = ArgumentCaptor.forClass(HdocUserDefinedRules.class);
        verify(ud08Mapper, times(1)).countUserDefinedRule("A1", 1L, "JP");
        verify(ud08Mapper, times(1)).insertUserDefinedRule(captor.capture());

        HdocUserDefinedRules captured = captor.getValue();
        assertEquals("A1", captured.getPc());
        assertEquals(Long.valueOf(1L), captured.getNum());
        assertEquals("JP", captured.getMarket());
        assertEquals("VAR001", captured.getVariable());
        assertEquals("VALUE001", captured.getVal());
        assertEquals("VS001", captured.getVs());
        assertEquals("VS002", captured.getVs2());
        assertEquals("备注", captured.getComments());
        assertEquals("202606", captured.getAddDate());
        assertEquals("", captured.getDeleteDate());
        assertEquals("admin", captured.getUserid());
        assertEquals("admin", captured.getRegisterUser());
        assertEquals("admin", captured.getUpdateUser());
        assertEquals("UD08", captured.getRegisterProcess());
        assertEquals("UD08", captured.getUpdateProcess());
    }

    @Test
    @DisplayName("[Add] 系统异常时应返回500")
    void testAdd_Exception() {
        when(ud08Mapper.countUserDefinedRule(anyString(), anyLong(), anyString()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(1L);
        request.setMarket("JP");

        UD08HomologationVariablesResponse response = service.UD08Add(request);

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMessage());
        assertNull(response.getData());
    }

    // ====================================================================
    // UD08Update 测试
    // ====================================================================

    @Test
    @DisplayName("[Update] productClass 为空时应返回400")
    void testUpdate_ProductClassEmpty() {
        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass(null);
        request.setNumber(1L);
        request.setMarket("JP");

        UD08HomologationVariablesResponse response = service.UD08Update(request);

        assertEquals(400, response.getCode());
        assertEquals("productClass不能为空", response.getMessage());
    }

    @Test
    @DisplayName("[Update] 主键被更改（originalProductClass != productClass）时应返回409")
    void testUpdate_PkChanged_ProductClass() {
        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("B2");
        request.setNumber(1L);
        request.setMarket("JP");
        request.setOriginalProductClass("A1");
        request.setOriginalNumber(1L);
        request.setOriginalMarket("JP");

        UD08HomologationVariablesResponse response = service.UD08Update(request);

        assertEquals(409, response.getCode());
        assertEquals("Primary key conflict, Please enter the correct content", response.getMessage());
        verify(ud08Mapper, never()).countUserDefinedRule(any(), any(), any());
    }

    @Test
    @DisplayName("[Update] 主键被更改（originalNumber != number）时应返回409")
    void testUpdate_PkChanged_Number() {
        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(2L);
        request.setMarket("JP");
        request.setOriginalProductClass("A1");
        request.setOriginalNumber(1L);
        request.setOriginalMarket("JP");

        UD08HomologationVariablesResponse response = service.UD08Update(request);

        assertEquals(409, response.getCode());
        assertEquals("Primary key conflict, Please enter the correct content", response.getMessage());
        verify(ud08Mapper, never()).countUserDefinedRule(any(), any(), any());
    }

    @Test
    @DisplayName("[Update] 主键被更改（originalMarket != market）时应返回409")
    void testUpdate_PkChanged_Market() {
        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(1L);
        request.setMarket("AUS");
        request.setOriginalProductClass("A1");
        request.setOriginalNumber(1L);
        request.setOriginalMarket("JP");

        UD08HomologationVariablesResponse response = service.UD08Update(request);

        assertEquals(409, response.getCode());
        assertEquals("Primary key conflict, Please enter the correct content", response.getMessage());
        verify(ud08Mapper, never()).countUserDefinedRule(any(), any(), any());
    }

    @Test
    @DisplayName("[Update] hasOriginalPk 为 false（Clear后）时应跳过主键冲突检查")
    void testUpdate_SkipPkCheckWhenNoOriginalPk() {
        // 所有 original 字段都为 null/empty → hasOriginalPk = false
        when(ud08Mapper.countUserDefinedRule("A1", 1L, "JP")).thenReturn(0);

        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(1L);
        request.setMarket("JP");
        request.setOriginalProductClass(null);
        request.setOriginalNumber(null);
        request.setOriginalMarket(null);
        request.setCreatedByUser("admin");

        UD08HomologationVariablesResponse response = service.UD08Update(request);

        assertEquals(404, response.getCode());
        assertEquals("Data does not exist, Please enter the correct content", response.getMessage());
        verify(ud08Mapper, times(1)).countUserDefinedRule("A1", 1L, "JP");
    }

    @Test
    @DisplayName("[Update] hasOriginalPk 通过 originalNumber 成立，主键被改应返回409")
    void testUpdate_PkCheckViaOriginalNumberWithChange() {
        // originalProductClass=null, originalNumber=1L, originalMarket=null
        // hasOriginalPk = false || true || false = true
        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(2L);
        request.setMarket("JP");
        request.setOriginalProductClass(null);
        request.setOriginalNumber(1L);
        request.setOriginalMarket(null);

        UD08HomologationVariablesResponse response = service.UD08Update(request);

        assertEquals(409, response.getCode());
        assertEquals("Primary key conflict, Please enter the correct content", response.getMessage());
        // 覆盖 hasOriginalPk 第二子句短路路径 + 三元表达式 false 分支（origPc为""、origMkt为""）
        verify(ud08Mapper, never()).countUserDefinedRule(any(), any(), any());
    }

    @Test
    @DisplayName("[Update] originalMarket 为空字符串时第三子句 !isEmpty()=false，跳过主键检查")
    void testUpdate_OriginalMarketEmptyString() {
        // originalProductClass=null, originalNumber=null, originalMarket=""
        // clause1: false, clause2: false
        // clause3: ""!=null=true → !"".isEmpty()=!true=false → clause3 false
        // hasOriginalPk = false
        when(ud08Mapper.countUserDefinedRule("A1", 1L, "JP")).thenReturn(0);

        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(1L);
        request.setMarket("JP");
        request.setOriginalProductClass(null);
        request.setOriginalNumber(null);
        request.setOriginalMarket("");
        request.setCreatedByUser("admin");

        UD08HomologationVariablesResponse response = service.UD08Update(request);

        assertEquals(404, response.getCode());
        assertEquals("Data does not exist, Please enter the correct content", response.getMessage());
        verify(ud08Mapper, times(1)).countUserDefinedRule("A1", 1L, "JP");
    }

    @Test
    @DisplayName("[Update] hasOriginalPk 通过 originalMarket 成立，主键被改应返回409")
    void testUpdate_PkCheckViaOriginalMarketWithChange() {
        // originalProductClass=null, originalNumber=null, originalMarket="JP"
        // hasOriginalPk = false || false || (true && true) = true
        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(1L);
        request.setMarket("AUS");
        request.setOriginalProductClass(null);
        request.setOriginalNumber(null);
        request.setOriginalMarket("JP");

        UD08HomologationVariablesResponse response = service.UD08Update(request);

        assertEquals(409, response.getCode());
        assertEquals("Primary key conflict, Please enter the correct content", response.getMessage());
        verify(ud08Mapper, never()).countUserDefinedRule(any(), any(), any());
    }

    @Test
    @DisplayName("[Update] originalProductClass 为空字符串时 hasOriginalPk=false，应跳过主键检查")
    void testUpdate_OriginalProductClassEmptySkipPk() {
        // originalProductClass="" → !isEmpty()=false → 第一子句false
        // originalNumber=null → 第二子句false
        // originalMarket=null → 第三子句false
        // hasOriginalPk = false
        when(ud08Mapper.countUserDefinedRule("A1", 1L, "JP")).thenReturn(0);

        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(1L);
        request.setMarket("JP");
        request.setOriginalProductClass("");
        request.setOriginalNumber(null);
        request.setOriginalMarket(null);
        request.setCreatedByUser("admin");

        UD08HomologationVariablesResponse response = service.UD08Update(request);

        assertEquals(404, response.getCode());
        assertEquals("Data does not exist, Please enter the correct content", response.getMessage());
        verify(ud08Mapper, times(1)).countUserDefinedRule("A1", 1L, "JP");
    }

    @Test
    @DisplayName("[Update] 数据不存在（count = 0）时应返回404")
    void testUpdate_DataNotFound() {
        when(ud08Mapper.countUserDefinedRule("A1", 1L, "JP")).thenReturn(0);

        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(1L);
        request.setMarket("JP");
        // 设置 original 与 current 一致，使 pkChanged = false
        request.setOriginalProductClass("A1");
        request.setOriginalNumber(1L);
        request.setOriginalMarket("JP");
        request.setCreatedByUser("admin");

        UD08HomologationVariablesResponse response = service.UD08Update(request);

        assertEquals(404, response.getCode());
        assertEquals("Data does not exist, Please enter the correct content", response.getMessage());
        verify(ud08Mapper, times(1)).countUserDefinedRule("A1", 1L, "JP");
    }

    @Test
    @DisplayName("[Update] count 为 null 时应返回404")
    void testUpdate_CountNull() {
        when(ud08Mapper.countUserDefinedRule("A1", 1L, "JP")).thenReturn(null);

        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(1L);
        request.setMarket("JP");
        request.setOriginalProductClass("A1");
        request.setOriginalNumber(1L);
        request.setOriginalMarket("JP");

        UD08HomologationVariablesResponse response = service.UD08Update(request);

        assertEquals(404, response.getCode());
        assertEquals("Data does not exist, Please enter the correct content", response.getMessage());
        verify(ud08Mapper, times(1)).countUserDefinedRule("A1", 1L, "JP");
        verify(ud08Mapper, never()).updateUserDefinedRule(any());
    }

    @Test
    @DisplayName("[Update] 更新成功时应返回200")
    void testUpdate_Success() {
        when(ud08Mapper.countUserDefinedRule("A1", 1L, "JP")).thenReturn(1);

        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(1L);
        request.setMarket("JP");
        request.setOriginalProductClass("A1");
        request.setOriginalNumber(1L);
        request.setOriginalMarket("JP");
        request.setVariable("VAR001");
        request.setValue("VALUE001");
        request.setVariantString1("VS001");
        request.setVariantString2("VS002");
        request.setComments("备注");
        request.setAddDate("202606");
        request.setDeleteDate("");
        request.setCreatedByUser("admin");

        UD08HomologationVariablesResponse response = service.UD08Update(request);

        assertEquals(200, response.getCode());
        assertEquals("数据更新成功", response.getMessage());

        ArgumentCaptor<HdocUserDefinedRules> captor = ArgumentCaptor.forClass(HdocUserDefinedRules.class);
        verify(ud08Mapper, times(1)).countUserDefinedRule("A1", 1L, "JP");
        verify(ud08Mapper, times(1)).updateUserDefinedRule(captor.capture());

        HdocUserDefinedRules captured = captor.getValue();
        assertEquals("A1", captured.getPc());
        assertEquals(Long.valueOf(1L), captured.getNum());
        assertEquals("JP", captured.getMarket());
        assertEquals("admin", captured.getUpdateUser());
        assertEquals("UD08", captured.getUpdateProcess());
    }

    @Test
    @DisplayName("[Update] 系统异常时应返回500")
    void testUpdate_Exception() {
        when(ud08Mapper.countUserDefinedRule(anyString(), anyLong(), anyString()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(1L);
        request.setMarket("JP");
        request.setOriginalProductClass("A1");
        request.setOriginalNumber(1L);
        request.setOriginalMarket("JP");

        UD08HomologationVariablesResponse response = service.UD08Update(request);

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMessage());
        assertNull(response.getData());
    }

    // ====================================================================
    // UD08Delete 测试
    // ====================================================================

    @Test
    @DisplayName("[Delete] productClass 为空时应返回400")
    void testDelete_ProductClassEmpty() {
        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass(null);
        request.setNumber(1L);
        request.setMarket("JP");

        UD08HomologationVariablesResponse response = service.UD08Delete(request);

        assertEquals(400, response.getCode());
        assertEquals("productClass不能为空", response.getMessage());
    }

    @Test
    @DisplayName("[Delete] number 为 null 时应返回400")
    void testDelete_NumberNull() {
        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(null);
        request.setMarket("JP");

        UD08HomologationVariablesResponse response = service.UD08Delete(request);

        assertEquals(400, response.getCode());
        assertEquals("number不能为空", response.getMessage());
    }

    @Test
    @DisplayName("[Delete] market 为空时应返回400")
    void testDelete_MarketEmpty() {
        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(1L);
        request.setMarket(null);

        UD08HomologationVariablesResponse response = service.UD08Delete(request);

        assertEquals(400, response.getCode());
        assertEquals("market不能为空", response.getMessage());
    }

    @Test
    @DisplayName("[Delete] 数据不存在（count = 0）时应返回404")
    void testDelete_DataNotFound() {
        when(ud08Mapper.countUserDefinedRule("A1", 1L, "JP")).thenReturn(0);

        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(1L);
        request.setMarket("JP");

        UD08HomologationVariablesResponse response = service.UD08Delete(request);

        assertEquals(404, response.getCode());
        assertEquals("Data does not exist, Please enter the correct content", response.getMessage());
        verify(ud08Mapper, times(1)).countUserDefinedRule("A1", 1L, "JP");
        verify(ud08Mapper, never()).deleteUserDefinedRule(any(), any(), any());
    }

    @Test
    @DisplayName("[Delete] count 为 null 时应返回404")
    void testDelete_CountNull() {
        when(ud08Mapper.countUserDefinedRule("A1", 1L, "JP")).thenReturn(null);

        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(1L);
        request.setMarket("JP");

        UD08HomologationVariablesResponse response = service.UD08Delete(request);

        assertEquals(404, response.getCode());
        assertEquals("Data does not exist, Please enter the correct content", response.getMessage());
        verify(ud08Mapper, times(1)).countUserDefinedRule("A1", 1L, "JP");
        verify(ud08Mapper, never()).deleteUserDefinedRule(any(), any(), any());
    }

    @Test
    @DisplayName("[Delete] 删除成功时应返回200")
    void testDelete_Success() {
        when(ud08Mapper.countUserDefinedRule("A1", 1L, "JP")).thenReturn(1);

        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(1L);
        request.setMarket("JP");

        UD08HomologationVariablesResponse response = service.UD08Delete(request);

        assertEquals(200, response.getCode());
        assertEquals("数据删除成功", response.getMessage());
        verify(ud08Mapper, times(1)).countUserDefinedRule("A1", 1L, "JP");
        verify(ud08Mapper, times(1)).deleteUserDefinedRule("A1", 1L, "JP");
    }

    @Test
    @DisplayName("[Delete] 系统异常时应返回500")
    void testDelete_Exception() {
        when(ud08Mapper.countUserDefinedRule(anyString(), anyLong(), anyString()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setProductClass("A1");
        request.setNumber(1L);
        request.setMarket("JP");

        UD08HomologationVariablesResponse response = service.UD08Delete(request);

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMessage());
        assertNull(response.getData());
    }
}
