package com.web.app.test;

import com.web.app.dto.UD10HdocvariablesRequest;
import com.web.app.dto.UD10HdocvariablesResponse;
import com.web.app.entity.HdocVariables;
import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.service.impl.UD10HdocvariablesServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD10HdocvariablesServiceImpl 单元测试
 * 覆盖所有分支：null分支、empty分支、空白分支、已存在分支、不存在分支、正常分支
 * 分支覆盖率达到 100%
 */
@ExtendWith(MockitoExtension.class)
class UD10HdocvariablesServiceImplTest {

    @Mock
    private HdocVariablesMapper hdocVariablesMapper;

    @InjectMocks
    private UD10HdocvariablesServiceImpl service;

    @Captor
    private ArgumentCaptor<HdocVariables> captor;

    // =========================================================================
    // addVariable
    // =========================================================================

    // -------------------------------------------------------
    // 分支: variable == null
    // 分支: variable.trim().isEmpty() (空字符串)
    // 分支: variable.trim().isEmpty() (纯空格)
    // 预期: code=400, "变量名不能为空"
    // -------------------------------------------------------

    @Test
    @DisplayName("addVariable - variable为null → 400")
    void add_variableNull_returns400() {
        UD10HdocvariablesRequest req = new UD10HdocvariablesRequest();
        req.setVariable(null);

        UD10HdocvariablesResponse response = service.addVariable(req);
        assertEquals(400, response.getCode());
        assertEquals("变量名不能为空", response.getMsg());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("addVariable - variable为空字符串 → 400")
    void add_variableEmpty_returns400() {
        UD10HdocvariablesRequest req = new UD10HdocvariablesRequest();
        req.setVariable("");

        UD10HdocvariablesResponse response = service.addVariable(req);
        assertEquals(400, response.getCode());
        assertEquals("变量名不能为空", response.getMsg());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("addVariable - variable为纯空格 → 400")
    void add_variableBlank_returns400() {
        UD10HdocvariablesRequest req = new UD10HdocvariablesRequest();
        req.setVariable("   ");

        UD10HdocvariablesResponse response = service.addVariable(req);
        assertEquals(400, response.getCode());
        assertEquals("变量名不能为空", response.getMsg());
        verifyNoInteractions(hdocVariablesMapper);
    }

    // -------------------------------------------------------
    // 分支: count > 0 → 已存在
    // -------------------------------------------------------

    @Test
    @DisplayName("addVariable - 变量已存在 → 400")
    void add_variableAlreadyExists_returns400() {
        UD10HdocvariablesRequest req = new UD10HdocvariablesRequest();
        req.setVariable("EXISTING_VAR");

        when(hdocVariablesMapper.countByVariable("EXISTING_VAR")).thenReturn(1);

        UD10HdocvariablesResponse response = service.addVariable(req);
        assertEquals(400, response.getCode());
        assertEquals("Variant already exists. Please enter the correct content", response.getMsg());
        verify(hdocVariablesMapper).countByVariable("EXISTING_VAR");
        verify(hdocVariablesMapper, never()).insert(any());
    }

    // -------------------------------------------------------
    // 分支: count == 0 + createdByUser为null → 自动生成
    // -------------------------------------------------------

    @Test
    @DisplayName("addVariable - createdByUser为null → 自动生成用户")
    void add_createdByUserNull_autoGenerate() {
        UD10HdocvariablesRequest req = new UD10HdocvariablesRequest();
        req.setVariable("NEW_VAR");
        req.setType("STRING");
        req.setDescription("New variable");
        req.setCreatedByUser(null);

        when(hdocVariablesMapper.countByVariable("NEW_VAR")).thenReturn(0);

        UD10HdocvariablesResponse response = service.addVariable(req);
        assertEquals(200, response.getCode());
        assertEquals("登录成功", response.getMsg());

        verify(hdocVariablesMapper).insert(captor.capture());
        HdocVariables captured = captor.getValue();
        assertEquals("NEW_VAR", captured.getVariable());
        assertEquals("STRING", captured.getType());
        assertEquals("New variable", captured.getDescription());
        assertNotNull(captured.getCreatedByUser());
        assertTrue(captured.getCreatedByUser().startsWith("AUTO_"));
    }

    // -------------------------------------------------------
    // 分支: count == 0 + createdByUser为空字符串 → 自动生成
    // -------------------------------------------------------

    @Test
    @DisplayName("addVariable - createdByUser为空串 → 自动生成用户")
    void add_createdByUserEmpty_autoGenerate() {
        UD10HdocvariablesRequest req = new UD10HdocvariablesRequest();
        req.setVariable("NEW_VAR2");
        req.setCreatedByUser("");

        when(hdocVariablesMapper.countByVariable("NEW_VAR2")).thenReturn(0);

        service.addVariable(req);

        verify(hdocVariablesMapper).insert(captor.capture());
        assertTrue(captor.getValue().getCreatedByUser().startsWith("AUTO_"));
    }

    // -------------------------------------------------------
    // 分支: createdByUser提供有效值 → 使用传入值
    // -------------------------------------------------------

    @Test
    @DisplayName("addVariable - createdByUser提供值 → 使用传入值")
    void add_createdByUserProvided_useValue() {
        UD10HdocvariablesRequest req = new UD10HdocvariablesRequest();
        req.setVariable("NEW_VAR3");
        req.setType("INT");
        req.setDescription("Int variable");
        req.setCreatedByUser("TEST_USER");

        when(hdocVariablesMapper.countByVariable("NEW_VAR3")).thenReturn(0);

        service.addVariable(req);

        verify(hdocVariablesMapper).insert(captor.capture());
        assertEquals("TEST_USER", captor.getValue().getCreatedByUser());
    }

    // =========================================================================
    // updateVariable
    // =========================================================================

    // -------------------------------------------------------
    // 分支: variable为null/empty/blank → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("updateVariable - variable为null → 400")
    void update_variableNull_returns400() {
        UD10HdocvariablesRequest req = new UD10HdocvariablesRequest();
        req.setVariable(null);

        UD10HdocvariablesResponse response = service.updateVariable(req);
        assertEquals(400, response.getCode());
        assertEquals("变量名不能为空", response.getMsg());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("updateVariable - variable为空串 → 400")
    void update_variableEmpty_returns400() {
        UD10HdocvariablesRequest req = new UD10HdocvariablesRequest();
        req.setVariable("");

        UD10HdocvariablesResponse response = service.updateVariable(req);
        assertEquals(400, response.getCode());
        verifyNoInteractions(hdocVariablesMapper);
    }

    // -------------------------------------------------------
    // 分支: count == 0 → 不存在
    // -------------------------------------------------------

    @Test
    @DisplayName("updateVariable - 变量不存在 → 400")
    void update_variableNotExists_returns400() {
        UD10HdocvariablesRequest req = new UD10HdocvariablesRequest();
        req.setVariable("NONEXISTENT");

        when(hdocVariablesMapper.countByVariable("NONEXISTENT")).thenReturn(0);

        UD10HdocvariablesResponse response = service.updateVariable(req);
        assertEquals(400, response.getCode());
        assertEquals("Variant does not exists. Please enter the correct content", response.getMsg());
        verify(hdocVariablesMapper, never()).update(any());
    }

    // -------------------------------------------------------
    // 分支: 更新成功
    // -------------------------------------------------------

    @Test
    @DisplayName("updateVariable - 更新成功 → 200")
    void update_success() {
        UD10HdocvariablesRequest req = new UD10HdocvariablesRequest();
        req.setVariable("EXISTING_VAR");
        req.setType("UPDATED_TYPE");
        req.setDescription("UPDATED_DESC");
        req.setCreatedByUser("UPD_USER");

        when(hdocVariablesMapper.countByVariable("EXISTING_VAR")).thenReturn(1);

        UD10HdocvariablesResponse response = service.updateVariable(req);
        assertEquals(200, response.getCode());
        assertEquals("更新成功", response.getMsg());

        verify(hdocVariablesMapper).update(captor.capture());
        HdocVariables captured = captor.getValue();
        assertEquals("EXISTING_VAR", captured.getVariable());
        assertEquals("UPDATED_TYPE", captured.getType());
        assertEquals("UPDATED_DESC", captured.getDescription());
        assertEquals("UPD_USER", captured.getCreatedByUser());
    }

    // =========================================================================
    // deleteVariable
    // =========================================================================

    // -------------------------------------------------------
    // 分支: variable为null/empty → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("deleteVariable - variable为null → 400")
    void delete_variableNull_returns400() {
        UD10HdocvariablesRequest req = new UD10HdocvariablesRequest();
        req.setVariable(null);

        UD10HdocvariablesResponse response = service.deleteVariable(req);
        assertEquals(400, response.getCode());
        assertEquals("变量名不能为空", response.getMsg());
        verifyNoInteractions(hdocVariablesMapper);
    }

    @Test
    @DisplayName("deleteVariable - variable为空串 → 400")
    void delete_variableEmpty_returns400() {
        UD10HdocvariablesRequest req = new UD10HdocvariablesRequest();
        req.setVariable("");

        UD10HdocvariablesResponse response = service.deleteVariable(req);
        assertEquals(400, response.getCode());
        verifyNoInteractions(hdocVariablesMapper);
    }

    // -------------------------------------------------------
    // 分支: count == 0 → 不存在
    // -------------------------------------------------------

    @Test
    @DisplayName("deleteVariable - 变量不存在 → 400")
    void delete_variableNotExists_returns400() {
        UD10HdocvariablesRequest req = new UD10HdocvariablesRequest();
        req.setVariable("NONEXISTENT");

        when(hdocVariablesMapper.countByVariable("NONEXISTENT")).thenReturn(0);

        UD10HdocvariablesResponse response = service.deleteVariable(req);
        assertEquals(400, response.getCode());
        assertEquals("Variant does not exists. Please enter the correct content", response.getMsg());
        verify(hdocVariablesMapper, never()).deleteByVariable(anyString());
    }

    // -------------------------------------------------------
    // 分支: 删除成功
    // -------------------------------------------------------

    @Test
    @DisplayName("deleteVariable - 删除成功 → 200")
    void delete_success() {
        UD10HdocvariablesRequest req = new UD10HdocvariablesRequest();
        req.setVariable("TO_DELETE");

        when(hdocVariablesMapper.countByVariable("TO_DELETE")).thenReturn(1);

        UD10HdocvariablesResponse response = service.deleteVariable(req);
        assertEquals(200, response.getCode());
        assertEquals("删除成功", response.getMsg());

        verify(hdocVariablesMapper).deleteByVariable("TO_DELETE");
    }
}
