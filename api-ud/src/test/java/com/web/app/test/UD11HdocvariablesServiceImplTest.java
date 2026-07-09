package com.web.app.test;

import com.web.app.dto.UD11HdocvariablesRequest;
import com.web.app.dto.UD11HdocvariablesResponse;
import com.web.app.entity.HdocVariables;
import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.service.impl.UD11HdocvariablesServiceImpl;
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
 * UD11HdocvariablesServiceImpl 单元测试
 * 覆盖所有分支：null分支、empty分支、正常分支
 * 分支覆盖率达到 100%
 */
@ExtendWith(MockitoExtension.class)
class UD11HdocvariablesServiceImplTest {

    @Mock
    private HdocVariablesMapper hdocVariablesMapper;

    @InjectMocks
    private UD11HdocvariablesServiceImpl service;

    // =========================================================================
    // searchVariables
    // =========================================================================

    // -------------------------------------------------------
    // 分支: list == null → variables为空列表, count=0
    // -------------------------------------------------------

    @Test
    @DisplayName("searchVariables - Mapper返回null → 空列表count=0")
    void search_listNull_emptyResult() {
        UD11HdocvariablesRequest req = new UD11HdocvariablesRequest();
        req.setVariable("VAR");
        req.setType("TYPE");
        req.setDescription("DESC");

        when(hdocVariablesMapper.searchVariables(any(HdocVariables.class))).thenReturn(null);

        UD11HdocvariablesResponse response = service.searchVariables(req);
        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());

        UD11HdocvariablesResponse.UD11HdocvariablesData data = response.getData();
        assertNotNull(data.getVariables());
        assertTrue(data.getVariables().isEmpty());
        assertEquals(0, data.getCount());

        verify(hdocVariablesMapper).searchVariables(any(HdocVariables.class));
    }

    // -------------------------------------------------------
    // 分支: list为空列表 → variables为空, count=0
    // -------------------------------------------------------

    @Test
    @DisplayName("searchVariables - Mapper返回空列表 → 空结果")
    void search_listEmpty_emptyResult() {
        UD11HdocvariablesRequest req = new UD11HdocvariablesRequest();

        when(hdocVariablesMapper.searchVariables(any(HdocVariables.class)))
                .thenReturn(Collections.emptyList());

        UD11HdocvariablesResponse response = service.searchVariables(req);
        assertEquals(200, response.getCode());

        assertEquals(0, response.getData().getCount());
        assertTrue(response.getData().getVariables().isEmpty());

        verify(hdocVariablesMapper).searchVariables(any(HdocVariables.class));
    }

    // -------------------------------------------------------
    // 分支: list有数据 → 映射所有字段
    // -------------------------------------------------------

    @Test
    @DisplayName("searchVariables - 有数据 → 映射所有字段, count正确")
    void search_listHasData_mapFields() {
        UD11HdocvariablesRequest req = new UD11HdocvariablesRequest();

        HdocVariables v1 = new HdocVariables();
        v1.setVariable("VAR1");
        v1.setType("STRING");
        v1.setDescription("First variable");
        v1.setCreatedByUser("USER1");
        v1.setCreateDate("2026-01-01");

        HdocVariables v2 = new HdocVariables();
        v2.setVariable("VAR2");
        v2.setType("INT");
        v2.setDescription("Second variable");
        v2.setCreatedByUser("USER2");
        v2.setCreateDate("2026-02-01");

        when(hdocVariablesMapper.searchVariables(any(HdocVariables.class)))
                .thenReturn(Arrays.asList(v1, v2));

        UD11HdocvariablesResponse response = service.searchVariables(req);
        assertEquals(200, response.getCode());

        UD11HdocvariablesResponse.UD11HdocvariablesData data = response.getData();
        assertEquals(2, data.getCount());
        assertEquals(2, data.getVariables().size());

        // 验证第一条映射
        Map<String, Object> item1 = data.getVariables().get(0);
        assertEquals("VAR1", item1.get("variable"));
        assertEquals("STRING", item1.get("type"));
        assertEquals("First variable", item1.get("description"));
        assertEquals("USER1", item1.get("createdByUser"));
        assertEquals("2026-01-01", item1.get("date"));

        // 验证第二条映射
        Map<String, Object> item2 = data.getVariables().get(1);
        assertEquals("VAR2", item2.get("variable"));
        assertEquals("INT", item2.get("type"));
        assertEquals("Second variable", item2.get("description"));
        assertEquals("USER2", item2.get("createdByUser"));
        assertEquals("2026-02-01", item2.get("date"));

        verify(hdocVariablesMapper).searchVariables(any(HdocVariables.class));
    }

    // -------------------------------------------------------
    // 分支: 验证HdocVariables request参数映射正确
    // -------------------------------------------------------

    @Test
    @DisplayName("searchVariables - 验证查询参数映射")
    void search_verifyParamMapping() {
        UD11HdocvariablesRequest req = new UD11HdocvariablesRequest();
        req.setVariable("VAR_SEARCH");
        req.setType("TYPE_SEARCH");
        req.setDescription("DESC_SEARCH");

        when(hdocVariablesMapper.searchVariables(any(HdocVariables.class))).thenReturn(Collections.emptyList());

        service.searchVariables(req);

        // 验证searchVariables的参数
        verify(hdocVariablesMapper).searchVariables(argThat(params ->
                "VAR_SEARCH".equals(params.getVariable())
                && "TYPE_SEARCH".equals(params.getType())
                && "DESC_SEARCH".equals(params.getDescription())
        ));
    }
}
