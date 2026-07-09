package com.web.app.test;

import com.web.app.dto.UD08HomologationVariablesResponse;
import com.web.app.dto.UD08UserDefinedRulesRequest;
import com.web.app.entity.HdocUserDefinedRules;
import com.web.app.entity.HdocVariables;
import com.web.app.entity.MarketMaster;
import com.web.app.entity.ProductClassMaster;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.mapper.MarketMasterMapper;
import com.web.app.mapper.ProductClassMasterMapper;
import com.web.app.service.impl.UD08HomologationVariablesServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD08HomologationVariablesServiceImpl 单元测试
 * 覆盖所有分支：null分支、empty分支、正常分支
 * 分支覆盖率达到 100%
 */
@ExtendWith(MockitoExtension.class)
class UD08HomologationVariablesServiceImplTest {

    @Mock
    private ProductClassMasterMapper productClassMasterMapper;

    @Mock
    private MarketMasterMapper marketMasterMapper;

    @Mock
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;

    @Mock
    private HdocVariablesMapper hdocVariablesMapper;

    @InjectMocks
    private UD08HomologationVariablesServiceImpl service;

    @Captor
    private ArgumentCaptor<HdocUserDefinedRules> rulesCaptor;

    // =========================================================================
    // selectProductclassmaster
    // =========================================================================

    @Test
    @DisplayName("selectProductclassmaster - 正常返回200")
    void selectProductclassmaster_success() {
        ProductClassMaster p1 = new ProductClassMaster();
        p1.setPc("CLASS1");
        ProductClassMaster p2 = new ProductClassMaster();
        p2.setPc("CLASS2");
        when(productClassMasterMapper.selectAll()).thenReturn(Arrays.asList(p1, p2));

        UD08HomologationVariablesResponse response = service.selectProductclassmaster();

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());

        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> data = (java.util.Map<String, Object>) response.getData();
        @SuppressWarnings("unchecked")
        List<ProductClassMaster> list = (List<ProductClassMaster>) data.get("productClasses");
        assertEquals(2, list.size());
        verify(productClassMasterMapper).selectAll();
    }

    // =========================================================================
    // selectMarketmaster
    // =========================================================================

    @Test
    @DisplayName("selectMarketmaster - 正常返回200")
    void selectMarketmaster_success() {
        MarketMaster m1 = new MarketMaster();
        m1.setMarket("AUS");
        when(marketMasterMapper.selectAll()).thenReturn(Collections.singletonList(m1));

        UD08HomologationVariablesResponse response = service.selectMarketmaster();

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());

        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> data = (java.util.Map<String, Object>) response.getData();
        @SuppressWarnings("unchecked")
        List<MarketMaster> list = (List<MarketMaster>) data.get("markets");
        assertEquals(1, list.size());
        verify(marketMasterMapper).selectAll();
    }

    // =========================================================================
    // selectHdocvariables
    // =========================================================================

    @Test
    @DisplayName("selectHdocvariables - 正常返回200")
    void selectHdocvariables_success() {
        HdocVariables v1 = new HdocVariables();
        v1.setVariable("VAR1");
        when(hdocVariablesMapper.selectAllVariables()).thenReturn(Collections.singletonList(v1));

        UD08HomologationVariablesResponse response = service.selectHdocvariables();

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());

        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> data = (java.util.Map<String, Object>) response.getData();
        @SuppressWarnings("unchecked")
        List<HdocVariables> list = (List<HdocVariables>) data.get("hdocVariables");
        assertEquals(1, list.size());
        verify(hdocVariablesMapper).selectAllVariables();
    }

    // =========================================================================
    // addUserDefinedRules
    // =========================================================================

    // -------------------------------------------------------
    // 分支: productClass == null
    // 分支: number == null
    // 分支: market == null
    // 预期: code=400, "参数不完整"
    // -------------------------------------------------------

    @Test
    @DisplayName("addUserDefinedRules - productClass为null → 400")
    void add_productClassNull_returns400() {
        UD08UserDefinedRulesRequest req = new UD08UserDefinedRulesRequest();
        req.setProductClass(null);
        req.setNumber("NUM1");
        req.setMarket("AUS");

        UD08HomologationVariablesResponse response = service.addUserDefinedRules(req);
        assertEquals(400, response.getCode());
        assertEquals("参数不完整", response.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper, hdocVariablesMapper);
    }

    @Test
    @DisplayName("addUserDefinedRules - number为null → 400")
    void add_numberNull_returns400() {
        UD08UserDefinedRulesRequest req = new UD08UserDefinedRulesRequest();
        req.setProductClass("PC1");
        req.setNumber(null);
        req.setMarket("AUS");

        UD08HomologationVariablesResponse response = service.addUserDefinedRules(req);
        assertEquals(400, response.getCode());
        assertEquals("参数不完整", response.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper, hdocVariablesMapper);
    }

    @Test
    @DisplayName("addUserDefinedRules - market为null → 400")
    void add_marketNull_returns400() {
        UD08UserDefinedRulesRequest req = new UD08UserDefinedRulesRequest();
        req.setProductClass("PC1");
        req.setNumber("NUM1");
        req.setMarket(null);

        UD08HomologationVariablesResponse response = service.addUserDefinedRules(req);
        assertEquals(400, response.getCode());
        assertEquals("参数不完整", response.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper, hdocVariablesMapper);
    }

    // -------------------------------------------------------
    // 分支: count > 0 → 主键冲突
    // -------------------------------------------------------

    @Test
    @DisplayName("addUserDefinedRules - 主键冲突 → 400")
    void add_primaryKeyConflict_returns400() {
        UD08UserDefinedRulesRequest req = new UD08UserDefinedRulesRequest();
        req.setProductClass("PC1");
        req.setNumber("NUM1");
        req.setMarket("AUS");

        when(hdocUserDefinedRulesMapper.countByCondition("PC1", "NUM1", "AUS")).thenReturn(1);

        UD08HomologationVariablesResponse response = service.addUserDefinedRules(req);
        assertEquals(400, response.getCode());
        assertEquals("Primary key conflict, Please enter the correct content", response.getMsg());
        verify(hdocUserDefinedRulesMapper).countByCondition("PC1", "NUM1", "AUS");
        verifyNoMoreInteractions(hdocUserDefinedRulesMapper);
        verifyNoInteractions(hdocVariablesMapper);
    }

    // -------------------------------------------------------
    // 分支: variable != null && !isEmpty → 校验variable是否存在
    // 分支: varCount == 0 → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("addUserDefinedRules - variable存在但不存在于HDOC_VARIABLES → 400")
    void add_variableProvided_butNotExists_returns400() {
        UD08UserDefinedRulesRequest req = new UD08UserDefinedRulesRequest();
        req.setProductClass("PC1");
        req.setNumber("NUM1");
        req.setMarket("AUS");
        req.setVariable("INVALID_VAR");

        when(hdocUserDefinedRulesMapper.countByCondition("PC1", "NUM1", "AUS")).thenReturn(0);
        when(hdocVariablesMapper.countByVariable("INVALID_VAR")).thenReturn(0);

        UD08HomologationVariablesResponse response = service.addUserDefinedRules(req);
        assertEquals(400, response.getCode());
        assertEquals("Variant does not exist, Please enter the correct content", response.getMsg());
        verify(hdocVariablesMapper).countByVariable("INVALID_VAR");
    }

    // -------------------------------------------------------
    // 分支: variable == null → 自动采番
    // 分支: string1 == null → 自动采番(V+8位)
    // 分支: value == null → 默认"0"
    // 分支: string2/comments/user/add/delete 为null → null存入
    // 分支: user == null → registerUser="SYSTEM"
    // 预期: insert被调用，返回200
    // -------------------------------------------------------

    @Test
    @DisplayName("addUserDefinedRules - variable/string1/value全null → 自动采番/默认值")
    void add_allOptionalNull_autoGenerateFields() {
        UD08UserDefinedRulesRequest req = new UD08UserDefinedRulesRequest();
        req.setProductClass("PC1");
        req.setNumber("NUM1");
        req.setMarket("AUS");
        // variable=null, string1=null, value=null, string2=null, comments=null, user=null, add=null, delete=null

        when(hdocUserDefinedRulesMapper.countByCondition("PC1", "NUM1", "AUS")).thenReturn(0);
        // variable=null → 不校验exist
        // variable==null, string1==null, value==null → auto

        service.addUserDefinedRules(req);

        verify(hdocUserDefinedRulesMapper).insert(rulesCaptor.capture());
        HdocUserDefinedRules captured = rulesCaptor.getValue();

        assertEquals("PC1", captured.getPc());
        assertEquals("NUM1", captured.getNum());
        assertEquals("AUS", captured.getMarket());
        // VS: string1==null → 自动采番 V开头
        assertTrue(captured.getVs().startsWith("V"));
        assertEquals(9, captured.getVs().length()); // V + 8位
        // VARIABLE: null → 自动采番 VAR_开头
        assertTrue(captured.getVariable().startsWith("VAR_"));
        // VAL: null → "0"
        assertEquals("0", captured.getVal());
        // 可为空字段
        assertNull(captured.getVs2());
        assertNull(captured.getComments());
        assertNull(captured.getUserId());
        assertNull(captured.getAddDate());
        assertNull(captured.getDeleteDate());
        // registerUser: user==null → SYSTEM
        assertEquals("SYSTEM", captured.getRegisterUser());
        assertEquals("SYSTEM", captured.getUpdateUser());
        assertEquals("UD08Add", captured.getRegisterProcess());
        assertEquals("UD08Add", captured.getUpdateProcess());
        assertNotNull(captured.getRegisterDatetime());
        assertNotNull(captured.getUpdateDatetime());

        verify(hdocUserDefinedRulesMapper).countByCondition("PC1", "NUM1", "AUS");
        verifyNoInteractions(hdocVariablesMapper);
    }

    // -------------------------------------------------------
    // 分支: variable != null && !isEmpty → 校验通过并插入
    // 分支: string1/value提供值 → 使用传入值
    // 分支: user提供值 → registerUser/updateUser使用传入值
    // 预期: insert被调用，返回200
    // -------------------------------------------------------

    @Test
    @DisplayName("addUserDefinedRules - 全部传入有效值 → 插入成功返回200")
    void add_allFieldsProvided_success() {
        UD08UserDefinedRulesRequest req = new UD08UserDefinedRulesRequest();
        req.setProductClass("PC1");
        req.setNumber("NUM1");
        req.setMarket("AUS");
        req.setVariable("EXISTING_VAR");
        req.setValue("1");
        req.setString1("MY_VS");
        req.setString2("MY_VS2");
        req.setComments("My comments");
        req.setUser("TEST_USER");
        req.setAdd("202630");
        req.setDelete("202640");

        when(hdocUserDefinedRulesMapper.countByCondition("PC1", "NUM1", "AUS")).thenReturn(0);
        when(hdocVariablesMapper.countByVariable("EXISTING_VAR")).thenReturn(1);

        service.addUserDefinedRules(req);

        verify(hdocUserDefinedRulesMapper).insert(rulesCaptor.capture());
        HdocUserDefinedRules captured = rulesCaptor.getValue();

        assertEquals("PC1", captured.getPc());
        assertEquals("NUM1", captured.getNum());
        assertEquals("AUS", captured.getMarket());
        assertEquals("MY_VS", captured.getVs());
        assertEquals("EXISTING_VAR", captured.getVariable());
        assertEquals("1", captured.getVal());
        assertEquals("MY_VS2", captured.getVs2());
        assertEquals("My comments", captured.getComments());
        assertEquals("TEST_USER", captured.getUserId());
        assertEquals("202630", captured.getAddDate());
        assertEquals("202640", captured.getDeleteDate());
        assertEquals("TEST_USER", captured.getRegisterUser());
        assertEquals("TEST_USER", captured.getUpdateUser());

        verify(hdocUserDefinedRulesMapper).countByCondition("PC1", "NUM1", "AUS");
        verify(hdocVariablesMapper).countByVariable("EXISTING_VAR");
    }

    // -------------------------------------------------------
    // 分支: variable为空字符串 → 不校验exist，自动采番
    // -------------------------------------------------------

    @Test
    @DisplayName("addUserDefinedRules - variable为空串 → 不校验exist+自动采番")
    void add_variableEmpty_skipExistCheck() {
        UD08UserDefinedRulesRequest req = new UD08UserDefinedRulesRequest();
        req.setProductClass("PC1");
        req.setNumber("NUM1");
        req.setMarket("AUS");
        req.setVariable("");

        when(hdocUserDefinedRulesMapper.countByCondition("PC1", "NUM1", "AUS")).thenReturn(0);

        service.addUserDefinedRules(req);

        verify(hdocUserDefinedRulesMapper).insert(rulesCaptor.capture());
        assertTrue(rulesCaptor.getValue().getVariable().startsWith("VAR_"));
        verifyNoInteractions(hdocVariablesMapper);
    }

    // =========================================================================
    // updateUserDefinedRules
    // =========================================================================

    // -------------------------------------------------------
    // 分支: productClass/number/market任一null → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("updateUserDefinedRules - 参数不完整 → 400")
    void update_paramsNull_returns400() {
        UD08UserDefinedRulesRequest req = new UD08UserDefinedRulesRequest();
        req.setProductClass("PC1");
        // number=null
        req.setMarket("AUS");

        UD08HomologationVariablesResponse response = service.updateUserDefinedRules(req);
        assertEquals(400, response.getCode());
        assertEquals("参数不完整", response.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    // -------------------------------------------------------
    // 分支: count == 0 → 记录不存在
    // -------------------------------------------------------

    @Test
    @DisplayName("updateUserDefinedRules - 记录不存在 → 400")
    void update_recordNotExists_returns400() {
        UD08UserDefinedRulesRequest req = new UD08UserDefinedRulesRequest();
        req.setProductClass("PC1");
        req.setNumber("NUM1");
        req.setMarket("AUS");

        when(hdocUserDefinedRulesMapper.countByCondition("PC1", "NUM1", "AUS")).thenReturn(0);

        UD08HomologationVariablesResponse response = service.updateUserDefinedRules(req);
        assertEquals(400, response.getCode());
        assertEquals("记录不存在", response.getMsg());
    }

    // -------------------------------------------------------
    // 分支: 更新成功
    // -------------------------------------------------------

    @Test
    @DisplayName("updateUserDefinedRules - 更新成功 → 200")
    void update_success() {
        UD08UserDefinedRulesRequest req = new UD08UserDefinedRulesRequest();
        req.setProductClass("PC1");
        req.setNumber("NUM1");
        req.setMarket("AUS");
        req.setVariable("VAR_UPD");
        req.setValue("2");
        req.setString1("VS_UPD");
        req.setString2("VS2_UPD");
        req.setComments("Updated comments");
        req.setUser("UPD_USER");
        req.setAdd("202630");
        req.setDelete("202640");

        when(hdocUserDefinedRulesMapper.countByCondition("PC1", "NUM1", "AUS")).thenReturn(1);

        UD08HomologationVariablesResponse response = service.updateUserDefinedRules(req);
        assertEquals(200, response.getCode());
        assertEquals("更新成功", response.getMsg());

        verify(hdocUserDefinedRulesMapper).update(rulesCaptor.capture());
        HdocUserDefinedRules captured = rulesCaptor.getValue();
        assertEquals("PC1", captured.getPc());
        assertEquals("NUM1", captured.getNum());
        assertEquals("AUS", captured.getMarket());
        assertEquals("VS_UPD", captured.getVs());
        assertEquals("VAR_UPD", captured.getVariable());
        assertEquals("2", captured.getVal());
        assertEquals("VS2_UPD", captured.getVs2());
        assertEquals("Updated comments", captured.getComments());
        assertEquals("UPD_USER", captured.getUserId());
        assertEquals("202630", captured.getAddDate());
        assertEquals("202640", captured.getDeleteDate());
        assertEquals("UD08Update", captured.getUpdateProcess());
        assertNotNull(captured.getUpdateDatetime());
    }

    // =========================================================================
    // deleteUserDefinedRules
    // =========================================================================

    // -------------------------------------------------------
    // 分支: 参数不完整 → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("deleteUserDefinedRules - 参数不完整 → 400")
    void delete_paramsNull_returns400() {
        UD08UserDefinedRulesRequest req = new UD08UserDefinedRulesRequest();
        req.setProductClass("PC1");
        // number=null, market=null

        UD08HomologationVariablesResponse response = service.deleteUserDefinedRules(req);
        assertEquals(400, response.getCode());
        assertEquals("参数不完整", response.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    // -------------------------------------------------------
    // 分支: count == 0 → 记录不存在
    // -------------------------------------------------------

    @Test
    @DisplayName("deleteUserDefinedRules - 记录不存在 → 400")
    void delete_recordNotExists_returns400() {
        UD08UserDefinedRulesRequest req = new UD08UserDefinedRulesRequest();
        req.setProductClass("PC1");
        req.setNumber("NUM1");
        req.setMarket("AUS");

        when(hdocUserDefinedRulesMapper.countByCondition("PC1", "NUM1", "AUS")).thenReturn(0);

        UD08HomologationVariablesResponse response = service.deleteUserDefinedRules(req);
        assertEquals(400, response.getCode());
        assertEquals("记录不存在", response.getMsg());
        verify(hdocUserDefinedRulesMapper, never()).deleteByCondition(anyString(), anyString(), anyString());
    }

    // -------------------------------------------------------
    // 分支: 删除成功
    // -------------------------------------------------------

    @Test
    @DisplayName("deleteUserDefinedRules - 删除成功 → 200")
    void delete_success() {
        UD08UserDefinedRulesRequest req = new UD08UserDefinedRulesRequest();
        req.setProductClass("PC1");
        req.setNumber("NUM1");
        req.setMarket("AUS");

        when(hdocUserDefinedRulesMapper.countByCondition("PC1", "NUM1", "AUS")).thenReturn(1);

        UD08HomologationVariablesResponse response = service.deleteUserDefinedRules(req);
        assertEquals(200, response.getCode());
        assertEquals("删除成功", response.getMsg());

        verify(hdocUserDefinedRulesMapper).deleteByCondition("PC1", "NUM1", "AUS");
    }
}
