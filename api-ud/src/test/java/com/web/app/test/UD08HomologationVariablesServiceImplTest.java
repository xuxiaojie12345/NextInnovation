package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocUserDefinedRules;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.service.impl.UD08HomologationVariablesServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD08HomologationVariablesServiceImpl 单元测试
 * 覆盖所有分支路径，达到100%分支覆盖率
 */
@ExtendWith(MockitoExtension.class)
class UD08HomologationVariablesServiceImplTest {

    @Mock
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;

    @InjectMocks
    private UD08HomologationVariablesServiceImpl service;

    // ============================================================
    // getProductClassMaster()
    // ============================================================

    @Test
    @DisplayName("getProductClassMaster - 返回null，应返回成功且data为null")
    void getProductClassMaster_ListNull_ShouldReturnSuccess() {
        when(hdocUserDefinedRulesMapper.selectProductClassMaster()).thenReturn(null);

        ApiResponse<?> result = service.getProductClassMaster();

        assertEquals(200, result.getCode());
        assertEquals("获取产品类别主数据成功", result.getMsg());
        assertNull(result.getData());
        verify(hdocUserDefinedRulesMapper, times(1)).selectProductClassMaster();
    }

    @Test
    @DisplayName("getProductClassMaster - 返回空列表，应返回成功且data为空列表")
    void getProductClassMaster_ListEmpty_ShouldReturnSuccess() {
        when(hdocUserDefinedRulesMapper.selectProductClassMaster()).thenReturn(Collections.emptyList());

        ApiResponse<?> result = service.getProductClassMaster();

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertTrue(((List<?>) result.getData()).isEmpty());
        verify(hdocUserDefinedRulesMapper, times(1)).selectProductClassMaster();
    }

    @Test
    @DisplayName("getProductClassMaster - 返回非空列表，应返回成功")
    void getProductClassMaster_ListNotEmpty_ShouldReturnSuccess() {
        List<Object> mockList = Collections.singletonList("item");
        when(hdocUserDefinedRulesMapper.selectProductClassMaster()).thenReturn(
                (List) mockList);

        ApiResponse<?> result = service.getProductClassMaster();

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        verify(hdocUserDefinedRulesMapper, times(1)).selectProductClassMaster();
    }

    @Test
    @DisplayName("getProductClassMaster - Mapper异常，应返回500")
    void getProductClassMaster_MapperThrowsException_ShouldReturn500() {
        when(hdocUserDefinedRulesMapper.selectProductClassMaster())
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.getProductClassMaster();

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // getMarketMaster()
    // ============================================================

    @Test
    @DisplayName("getMarketMaster - 返回null，应返回成功且data为null")
    void getMarketMaster_ListNull_ShouldReturnSuccess() {
        when(hdocUserDefinedRulesMapper.selectMarketMaster()).thenReturn(null);

        ApiResponse<?> result = service.getMarketMaster();

        assertEquals(200, result.getCode());
        assertEquals("获取市场主数据成功", result.getMsg());
        assertNull(result.getData());
        verify(hdocUserDefinedRulesMapper, times(1)).selectMarketMaster();
    }

    @Test
    @DisplayName("getMarketMaster - 返回空列表，应返回成功")
    void getMarketMaster_ListEmpty_ShouldReturnSuccess() {
        when(hdocUserDefinedRulesMapper.selectMarketMaster()).thenReturn(Collections.emptyList());

        ApiResponse<?> result = service.getMarketMaster();

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertTrue(((List<?>) result.getData()).isEmpty());
        verify(hdocUserDefinedRulesMapper, times(1)).selectMarketMaster();
    }

    @Test
    @DisplayName("getMarketMaster - 返回非空列表，应返回成功")
    void getMarketMaster_ListNotEmpty_ShouldReturnSuccess() {
        List<Object> mockList = Collections.singletonList("item");
        when(hdocUserDefinedRulesMapper.selectMarketMaster()).thenReturn((List) mockList);

        ApiResponse<?> result = service.getMarketMaster();

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        verify(hdocUserDefinedRulesMapper, times(1)).selectMarketMaster();
    }

    @Test
    @DisplayName("getMarketMaster - Mapper异常，应返回500")
    void getMarketMaster_MapperThrowsException_ShouldReturn500() {
        when(hdocUserDefinedRulesMapper.selectMarketMaster())
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.getMarketMaster();

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // getHdocVariables()
    // ============================================================

    @Test
    @DisplayName("getHdocVariables - 返回null，应返回成功且data为null")
    void getHdocVariables_ListNull_ShouldReturnSuccess() {
        when(hdocUserDefinedRulesMapper.selectHdocVariables()).thenReturn(null);

        ApiResponse<?> result = service.getHdocVariables();

        assertEquals(200, result.getCode());
        assertEquals("获取HDOC变量信息成功", result.getMsg());
        assertNull(result.getData());
        verify(hdocUserDefinedRulesMapper, times(1)).selectHdocVariables();
    }

    @Test
    @DisplayName("getHdocVariables - 返回空列表，应返回成功")
    void getHdocVariables_ListEmpty_ShouldReturnSuccess() {
        when(hdocUserDefinedRulesMapper.selectHdocVariables()).thenReturn(Collections.emptyList());

        ApiResponse<?> result = service.getHdocVariables();

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertTrue(((List<?>) result.getData()).isEmpty());
        verify(hdocUserDefinedRulesMapper, times(1)).selectHdocVariables();
    }

    @Test
    @DisplayName("getHdocVariables - 返回非空列表，应返回成功")
    void getHdocVariables_ListNotEmpty_ShouldReturnSuccess() {
        List<Object> mockList = Collections.singletonList("item");
        when(hdocUserDefinedRulesMapper.selectHdocVariables()).thenReturn((List) mockList);

        ApiResponse<?> result = service.getHdocVariables();

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        verify(hdocUserDefinedRulesMapper, times(1)).selectHdocVariables();
    }

    @Test
    @DisplayName("getHdocVariables - Mapper异常，应返回500")
    void getHdocVariables_MapperThrowsException_ShouldReturn500() {
        when(hdocUserDefinedRulesMapper.selectHdocVariables())
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.getHdocVariables();

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // addUserDefinedRule() — 参数校验
    // ============================================================

    private HdocUserDefinedRules createValidRule() {
        HdocUserDefinedRules r = new HdocUserDefinedRules();
        r.setPc("PC001");
        r.setNum(1);
        r.setMarket("JP");
        r.setUserid("admin");
        r.setAddDate("202607");
        return r;
    }

    @Test
    @DisplayName("addUserDefinedRule - pc为null，应返回400")
    void addUserDefinedRule_PcNull_ShouldReturn400() {
        HdocUserDefinedRules r = createValidRule();
        r.setPc(null);

        ApiResponse<?> result = service.addUserDefinedRule(r);

        assertEquals(400, result.getCode());
        assertEquals("Product class不能为空", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("addUserDefinedRule - pc为空字符串，应返回400")
    void addUserDefinedRule_PcEmpty_ShouldReturn400() {
        HdocUserDefinedRules r = createValidRule();
        r.setPc("");

        ApiResponse<?> result = service.addUserDefinedRule(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("addUserDefinedRule - num为null，应返回400")
    void addUserDefinedRule_NumNull_ShouldReturn400() {
        HdocUserDefinedRules r = createValidRule();
        r.setNum(null);

        ApiResponse<?> result = service.addUserDefinedRule(r);

        assertEquals(400, result.getCode());
        assertEquals("Number不能为空", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("addUserDefinedRule - market为null，应返回400")
    void addUserDefinedRule_MarketNull_ShouldReturn400() {
        HdocUserDefinedRules r = createValidRule();
        r.setMarket(null);

        ApiResponse<?> result = service.addUserDefinedRule(r);

        assertEquals(400, result.getCode());
        assertEquals("Market不能为空", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("addUserDefinedRule - market为空字符串，应返回400")
    void addUserDefinedRule_MarketEmpty_ShouldReturn400() {
        HdocUserDefinedRules r = createValidRule();
        r.setMarket("");

        ApiResponse<?> result = service.addUserDefinedRule(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("addUserDefinedRule - vs超过100字符，应返回400")
    void addUserDefinedRule_VsTooLong_ShouldReturn400() {
        HdocUserDefinedRules r = createValidRule();
        r.setVs(new String(new char[101]).replace('\0', 'X'));

        ApiResponse<?> result = service.addUserDefinedRule(r);

        assertEquals(400, result.getCode());
        assertEquals("Variant string.1长度不能超过100", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("addUserDefinedRule - vs2超过100字符，应返回400")
    void addUserDefinedRule_Vs2TooLong_ShouldReturn400() {
        HdocUserDefinedRules r = createValidRule();
        r.setVs2(new String(new char[101]).replace('\0', 'Y'));

        ApiResponse<?> result = service.addUserDefinedRule(r);

        assertEquals(400, result.getCode());
        assertEquals("Variant string.2长度不能超过100", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("addUserDefinedRule - variable超过20字符，应返回400")
    void addUserDefinedRule_VariableTooLong_ShouldReturn400() {
        HdocUserDefinedRules r = createValidRule();
        r.setVariable(new String(new char[21]).replace('\0', 'Z'));

        ApiResponse<?> result = service.addUserDefinedRule(r);

        assertEquals(400, result.getCode());
        assertEquals("Variable长度不能超过20", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("addUserDefinedRule - val超过200字符，应返回400")
    void addUserDefinedRule_ValTooLong_ShouldReturn400() {
        HdocUserDefinedRules r = createValidRule();
        r.setVal(new String(new char[201]).replace('\0', 'W'));

        ApiResponse<?> result = service.addUserDefinedRule(r);

        assertEquals(400, result.getCode());
        assertEquals("Value长度不能超过200", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("addUserDefinedRule - 所有长度校验字段设为有效值，应通过校验并成功插入")
    void addUserDefinedRule_AllLengthFieldsValid_ShouldPassValidation() {
        HdocUserDefinedRules r = createValidRule();
        r.setVs("VALID_VS");
        r.setVs2("VALID_VS2");
        r.setVariable("VALID_VAR");
        r.setVal("VALID_VAL");
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP")).thenReturn(0);
        when(hdocUserDefinedRulesMapper.insert(any())).thenReturn(1);

        ApiResponse<?> result = service.addUserDefinedRule(r);

        assertEquals(200, result.getCode());
        verify(hdocUserDefinedRulesMapper, times(1)).insert(r);
    }

    // ============================================================
    // addUserDefinedRule() — 业务逻辑分支
    // ============================================================

    @Test
    @DisplayName("addUserDefinedRule - 主键冲突，应返回409")
    void addUserDefinedRule_PrimaryKeyConflict_ShouldReturn409() {
        HdocUserDefinedRules r = createValidRule();
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP")).thenReturn(1);

        ApiResponse<?> result = service.addUserDefinedRule(r);

        assertEquals(409, result.getCode());
        assertEquals("Primary key conflict, Please enter the correct content", result.getMsg());
        verify(hdocUserDefinedRulesMapper, never()).insert(any());
    }

    @Test
    @DisplayName("addUserDefinedRule - addDate为null，应使用当前年月")
    void addUserDefinedRule_AddDateNull_ShouldUseDefault() {
        HdocUserDefinedRules r = createValidRule();
        r.setAddDate(null);
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP")).thenReturn(0);
        when(hdocUserDefinedRulesMapper.insert(any())).thenReturn(1);

        ApiResponse<?> result = service.addUserDefinedRule(r);

        assertEquals(200, result.getCode());
        assertNotNull(r.getAddDate());
        verify(hdocUserDefinedRulesMapper, times(1)).insert(r);
    }

    @Test
    @DisplayName("addUserDefinedRule - addDate为空字符串，应使用当前年月")
    void addUserDefinedRule_AddDateEmpty_ShouldUseDefault() {
        HdocUserDefinedRules r = createValidRule();
        r.setAddDate("");
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP")).thenReturn(0);
        when(hdocUserDefinedRulesMapper.insert(any())).thenReturn(1);

        ApiResponse<?> result = service.addUserDefinedRule(r);

        assertEquals(200, result.getCode());
        assertNotNull(r.getAddDate());
        verify(hdocUserDefinedRulesMapper, times(1)).insert(r);
    }

    @Test
    @DisplayName("addUserDefinedRule - userid为null，registerUser/updateUser用SYSTEM")
    void addUserDefinedRule_UseridNull_ShouldUseDefaultSystem() {
        HdocUserDefinedRules r = createValidRule();
        r.setUserid(null);
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP")).thenReturn(0);
        when(hdocUserDefinedRulesMapper.insert(any())).thenReturn(1);

        ApiResponse<?> result = service.addUserDefinedRule(r);

        assertEquals(200, result.getCode());
        assertEquals("SYSTEM", r.getRegisterUser());
        assertEquals("SYSTEM", r.getUpdateUser());
        assertEquals("UD08_ADD", r.getRegisterProcess());
        assertEquals("UD08_ADD", r.getUpdateProcess());
        verify(hdocUserDefinedRulesMapper, times(1)).insert(r);
    }

    @Test
    @DisplayName("addUserDefinedRule - 插入成功，应返回成功")
    void addUserDefinedRule_InsertSuccess_ShouldReturnSuccess() {
        HdocUserDefinedRules r = createValidRule();
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP")).thenReturn(0);
        when(hdocUserDefinedRulesMapper.insert(any())).thenReturn(1);

        ApiResponse<?> result = service.addUserDefinedRule(r);

        assertEquals(200, result.getCode());
        assertEquals("添加用户定义规则成功", result.getMsg());
        assertNotNull(result.getData());
        verify(hdocUserDefinedRulesMapper, times(1)).insert(r);
    }

    @Test
    @DisplayName("addUserDefinedRule - 插入返回0，应返回500")
    void addUserDefinedRule_InsertReturnsZero_ShouldReturn500() {
        HdocUserDefinedRules r = createValidRule();
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP")).thenReturn(0);
        when(hdocUserDefinedRulesMapper.insert(any())).thenReturn(0);

        ApiResponse<?> result = service.addUserDefinedRule(r);

        assertEquals(500, result.getCode());
        assertEquals("添加失败", result.getMsg());
    }

    @Test
    @DisplayName("addUserDefinedRule - Mapper异常，应返回500")
    void addUserDefinedRule_MapperThrowsException_ShouldReturn500() {
        HdocUserDefinedRules r = createValidRule();
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP"))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.addUserDefinedRule(r);

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // updateUserDefinedRule() — 参数校验
    // ============================================================

    @Test
    @DisplayName("updateUserDefinedRule - pc为null，应返回400")
    void updateUserDefinedRule_PcNull_ShouldReturn400() {
        HdocUserDefinedRules r = createValidRule();
        r.setPc(null);

        ApiResponse<?> result = service.updateUserDefinedRule(r);

        assertEquals(400, result.getCode());
        assertEquals("Product class不能为空", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("updateUserDefinedRule - pc为空字符串，应返回400")
    void updateUserDefinedRule_PcEmpty_ShouldReturn400() {
        HdocUserDefinedRules r = createValidRule();
        r.setPc("");

        ApiResponse<?> result = service.updateUserDefinedRule(r);

        assertEquals(400, result.getCode());
        assertEquals("Product class不能为空", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("updateUserDefinedRule - market为空字符串，应返回400")
    void updateUserDefinedRule_MarketEmpty_ShouldReturn400() {
        HdocUserDefinedRules r = createValidRule();
        r.setMarket("");

        ApiResponse<?> result = service.updateUserDefinedRule(r);

        assertEquals(400, result.getCode());
        assertEquals("Market不能为空", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("updateUserDefinedRule - num为null，应返回400")
    void updateUserDefinedRule_NumNull_ShouldReturn400() {
        HdocUserDefinedRules r = createValidRule();
        r.setNum(null);

        ApiResponse<?> result = service.updateUserDefinedRule(r);

        assertEquals(400, result.getCode());
        assertEquals("Number不能为空", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("updateUserDefinedRule - market为null，应返回400")
    void updateUserDefinedRule_MarketNull_ShouldReturn400() {
        HdocUserDefinedRules r = createValidRule();
        r.setMarket(null);

        ApiResponse<?> result = service.updateUserDefinedRule(r);

        assertEquals(400, result.getCode());
        assertEquals("Market不能为空", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("updateUserDefinedRule - variable超过20字符，应返回400")
    void updateUserDefinedRule_VariableTooLong_ShouldReturn400() {
        HdocUserDefinedRules r = createValidRule();
        r.setVariable(new String(new char[21]).replace('\0', 'Z'));

        ApiResponse<?> result = service.updateUserDefinedRule(r);

        assertEquals(400, result.getCode());
        assertEquals("Variable长度不能超过20", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("updateUserDefinedRule - vs超过100字符，应返回400")
    void updateUserDefinedRule_VsTooLong_ShouldReturn400() {
        HdocUserDefinedRules r = createValidRule();
        r.setVs(new String(new char[101]).replace('\0', 'X'));

        ApiResponse<?> result = service.updateUserDefinedRule(r);

        assertEquals(400, result.getCode());
        assertEquals("Variant string.1长度不能超过100", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("updateUserDefinedRule - vs2超过100字符，应返回400")
    void updateUserDefinedRule_Vs2TooLong_ShouldReturn400() {
        HdocUserDefinedRules r = createValidRule();
        r.setVs2(new String(new char[101]).replace('\0', 'Y'));

        ApiResponse<?> result = service.updateUserDefinedRule(r);

        assertEquals(400, result.getCode());
        assertEquals("Variant string.2长度不能超过100", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("updateUserDefinedRule - val超过200字符，应返回400")
    void updateUserDefinedRule_ValTooLong_ShouldReturn400() {
        HdocUserDefinedRules r = createValidRule();
        r.setVal(new String(new char[201]).replace('\0', 'W'));

        ApiResponse<?> result = service.updateUserDefinedRule(r);

        assertEquals(400, result.getCode());
        assertEquals("Value长度不能超过200", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("updateUserDefinedRule - 所有长度校验字段设为有效值，应通过校验")
    void updateUserDefinedRule_AllLengthFieldsValid_ShouldPassValidation() {
        HdocUserDefinedRules r = createValidRule();
        r.setVs("VALID_VS");
        r.setVs2("VALID_VS2");
        r.setVariable("VALID_VAR");
        r.setVal("VALID_VAL");
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP")).thenReturn(1);
        when(hdocUserDefinedRulesMapper.update(any())).thenReturn(1);

        ApiResponse<?> result = service.updateUserDefinedRule(r);

        assertEquals(200, result.getCode());
        verify(hdocUserDefinedRulesMapper, times(1)).update(r);
    }

    // ============================================================
    // updateUserDefinedRule() — 业务逻辑分支
    // ============================================================

    @Test
    @DisplayName("updateUserDefinedRule - 记录不存在，应返回404")
    void updateUserDefinedRule_NotFound_ShouldReturn404() {
        HdocUserDefinedRules r = createValidRule();
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP")).thenReturn(0);

        ApiResponse<?> result = service.updateUserDefinedRule(r);

        assertEquals(404, result.getCode());
        assertEquals("Data does not exist, Please enter the correct content", result.getMsg());
        verify(hdocUserDefinedRulesMapper, never()).update(any());
    }

    @Test
    @DisplayName("updateUserDefinedRule - userid为null，应使用SYSTEM")
    void updateUserDefinedRule_UseridNull_ShouldUseDefaultSystem() {
        HdocUserDefinedRules r = createValidRule();
        r.setUserid(null);
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP")).thenReturn(1);
        when(hdocUserDefinedRulesMapper.update(any())).thenReturn(1);

        ApiResponse<?> result = service.updateUserDefinedRule(r);

        assertEquals(200, result.getCode());
        assertEquals("SYSTEM", r.getUpdateUser());
        assertEquals("UD08_UPDATE", r.getUpdateProcess());
        verify(hdocUserDefinedRulesMapper, times(1)).update(r);
    }

    @Test
    @DisplayName("updateUserDefinedRule - 更新成功，应返回成功")
    void updateUserDefinedRule_UpdateSuccess_ShouldReturnSuccess() {
        HdocUserDefinedRules r = createValidRule();
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP")).thenReturn(1);
        when(hdocUserDefinedRulesMapper.update(any())).thenReturn(1);

        ApiResponse<?> result = service.updateUserDefinedRule(r);

        assertEquals(200, result.getCode());
        assertEquals("更新用户定义规则成功", result.getMsg());
        assertNotNull(result.getData());
        verify(hdocUserDefinedRulesMapper, times(1)).update(r);
    }

    @Test
    @DisplayName("updateUserDefinedRule - 更新返回0，应返回500")
    void updateUserDefinedRule_UpdateReturnsZero_ShouldReturn500() {
        HdocUserDefinedRules r = createValidRule();
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP")).thenReturn(1);
        when(hdocUserDefinedRulesMapper.update(any())).thenReturn(0);

        ApiResponse<?> result = service.updateUserDefinedRule(r);

        assertEquals(500, result.getCode());
        assertEquals("更新失败", result.getMsg());
    }

    @Test
    @DisplayName("updateUserDefinedRule - Mapper异常，应返回500")
    void updateUserDefinedRule_MapperThrowsException_ShouldReturn500() {
        HdocUserDefinedRules r = createValidRule();
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP"))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.updateUserDefinedRule(r);

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // deleteUserDefinedRule() — 参数校验
    // ============================================================

    @Test
    @DisplayName("deleteUserDefinedRule - pc为null，应返回400")
    void deleteUserDefinedRule_PcNull_ShouldReturn400() {
        ApiResponse<?> result = service.deleteUserDefinedRule(null, 1, "JP", "admin");

        assertEquals(400, result.getCode());
        assertEquals("Product class不能为空", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("deleteUserDefinedRule - pc为空字符串，应返回400")
    void deleteUserDefinedRule_PcEmpty_ShouldReturn400() {
        ApiResponse<?> result = service.deleteUserDefinedRule("", 1, "JP", "admin");

        assertEquals(400, result.getCode());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("deleteUserDefinedRule - num为null，应返回400")
    void deleteUserDefinedRule_NumNull_ShouldReturn400() {
        ApiResponse<?> result = service.deleteUserDefinedRule("PC001", null, "JP", "admin");

        assertEquals(400, result.getCode());
        assertEquals("Number不能为空", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("deleteUserDefinedRule - market为null，应返回400")
    void deleteUserDefinedRule_MarketNull_ShouldReturn400() {
        ApiResponse<?> result = service.deleteUserDefinedRule("PC001", 1, null, "admin");

        assertEquals(400, result.getCode());
        assertEquals("Market不能为空", result.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("deleteUserDefinedRule - market为空字符串，应返回400")
    void deleteUserDefinedRule_MarketEmpty_ShouldReturn400() {
        ApiResponse<?> result = service.deleteUserDefinedRule("PC001", 1, "", "admin");

        assertEquals(400, result.getCode());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    // ============================================================
    // deleteUserDefinedRule() — 业务逻辑分支
    // ============================================================

    @Test
    @DisplayName("deleteUserDefinedRule - 记录不存在，应返回404")
    void deleteUserDefinedRule_NotFound_ShouldReturn404() {
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP")).thenReturn(0);

        ApiResponse<?> result = service.deleteUserDefinedRule("PC001", 1, "JP", "admin");

        assertEquals(404, result.getCode());
        assertEquals("Data does not exist, Please enter the correct content", result.getMsg());
        verify(hdocUserDefinedRulesMapper, never()).softDelete(any(), any(), any(), any());
    }

    @Test
    @DisplayName("deleteUserDefinedRule - updateUser为null，应使用SYSTEM")
    void deleteUserDefinedRule_UpdateUserNull_ShouldUseDefaultSystem() {
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP")).thenReturn(1);
        when(hdocUserDefinedRulesMapper.softDelete("PC001", 1, "JP", "SYSTEM")).thenReturn(1);

        ApiResponse<?> result = service.deleteUserDefinedRule("PC001", 1, "JP", null);

        assertEquals(200, result.getCode());
        assertEquals("删除用户定义规则成功", result.getMsg());
        verify(hdocUserDefinedRulesMapper, times(1)).softDelete("PC001", 1, "JP", "SYSTEM");
    }

    @Test
    @DisplayName("deleteUserDefinedRule - 软删除成功，应返回成功")
    void deleteUserDefinedRule_SoftDeleteSuccess_ShouldReturnSuccess() {
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP")).thenReturn(1);
        when(hdocUserDefinedRulesMapper.softDelete("PC001", 1, "JP", "admin")).thenReturn(1);

        ApiResponse<?> result = service.deleteUserDefinedRule("PC001", 1, "JP", "admin");

        assertEquals(200, result.getCode());
        assertEquals("删除用户定义规则成功", result.getMsg());
        assertNotNull(result.getData());
        verify(hdocUserDefinedRulesMapper, times(1)).softDelete("PC001", 1, "JP", "admin");
    }

    @Test
    @DisplayName("deleteUserDefinedRule - 软删除返回0，应返回500")
    void deleteUserDefinedRule_SoftDeleteReturnsZero_ShouldReturn500() {
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP")).thenReturn(1);
        when(hdocUserDefinedRulesMapper.softDelete("PC001", 1, "JP", "admin")).thenReturn(0);

        ApiResponse<?> result = service.deleteUserDefinedRule("PC001", 1, "JP", "admin");

        assertEquals(500, result.getCode());
        assertEquals("删除失败", result.getMsg());
    }

    @Test
    @DisplayName("deleteUserDefinedRule - Mapper异常，应返回500")
    void deleteUserDefinedRule_MapperThrowsException_ShouldReturn500() {
        when(hdocUserDefinedRulesMapper.countByPrimaryKey("PC001", 1, "JP"))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.deleteUserDefinedRule("PC001", 1, "JP", "admin");

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }
}
