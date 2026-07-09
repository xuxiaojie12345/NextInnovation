package com.web.app.test;

import com.web.app.dto.UD09DeleteHdocuserdefinedrulesRequest;
import com.web.app.dto.UD09DeleteHdocuserdefinedrulesResponse;
import com.web.app.entity.HdocUserDefinedRules;
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
 * 覆盖所有分支：null分支、empty分支、正常分支
 * 分支覆盖率达到 100%
 */
@ExtendWith(MockitoExtension.class)
class UD09DeleteHdocuserdefinedrulesServiceImplTest {

    @Mock
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;

    @InjectMocks
    private UD09DeleteHdocuserdefinedrulesServiceImpl service;

    // =========================================================================
    // searchRules
    // =========================================================================

    // -------------------------------------------------------
    // 分支: records != null → count = records.size()
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("searchRules - 查询有结果 → count=2")
    void searchRules_hasData() {
        UD09DeleteHdocuserdefinedrulesRequest req = new UD09DeleteHdocuserdefinedrulesRequest();
        req.setProductClass("PC1");
        req.setNumber("NUM1");
        req.setMarket("AUS");
        req.setVariable("VAR1");
        req.setValue("1");
        req.setString1("VS1");
        req.setString2("VS2");
        req.setComments("comments");

        HdocUserDefinedRules r1 = new HdocUserDefinedRules();
        r1.setPc("PC1");
        r1.setNum("NUM1");
        HdocUserDefinedRules r2 = new HdocUserDefinedRules();
        r2.setPc("PC2");
        r2.setNum("NUM2");

        when(hdocUserDefinedRulesMapper.searchRules(any(HdocUserDefinedRules.class)))
                .thenReturn(Arrays.asList(r1, r2));

        UD09DeleteHdocuserdefinedrulesResponse response = service.searchRules(req);
        assertEquals(200, response.getCode());
        assertEquals("Success", response.getMsg());

        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals(2, data.get("count"));
        List<HdocUserDefinedRules> records = (List<HdocUserDefinedRules>) data.get("records");
        assertEquals(2, records.size());

        verify(hdocUserDefinedRulesMapper).searchRules(any(HdocUserDefinedRules.class));
    }

    // -------------------------------------------------------
    // 分支: records == null → count = 0
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("searchRules - 查询结果为null → count=0")
    void searchRules_returnsNull() {
        UD09DeleteHdocuserdefinedrulesRequest req = new UD09DeleteHdocuserdefinedrulesRequest();
        when(hdocUserDefinedRulesMapper.searchRules(any(HdocUserDefinedRules.class))).thenReturn(null);

        UD09DeleteHdocuserdefinedrulesResponse response = service.searchRules(req);
        assertEquals(200, response.getCode());

        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals(0, data.get("count"));
        assertNull(data.get("records"));

        verify(hdocUserDefinedRulesMapper).searchRules(any(HdocUserDefinedRules.class));
    }

    // -------------------------------------------------------
    // 分支: records 为空列表 → count = 0
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("searchRules - 查询结果为空列表 → count=0")
    void searchRules_returnsEmptyList() {
        UD09DeleteHdocuserdefinedrulesRequest req = new UD09DeleteHdocuserdefinedrulesRequest();
        when(hdocUserDefinedRulesMapper.searchRules(any(HdocUserDefinedRules.class)))
                .thenReturn(Collections.emptyList());

        UD09DeleteHdocuserdefinedrulesResponse response = service.searchRules(req);
        assertEquals(200, response.getCode());

        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals(0, data.get("count"));

        verify(hdocUserDefinedRulesMapper).searchRules(any(HdocUserDefinedRules.class));
    }

    // =========================================================================
    // deleteSelected
    // =========================================================================

    // -------------------------------------------------------
    // 分支: selectedRecords == null → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("deleteSelected - selectedRecords为null → 400")
    void deleteSelected_null_returns400() {
        UD09DeleteHdocuserdefinedrulesRequest req = new UD09DeleteHdocuserdefinedrulesRequest();
        req.setSelectedRecords(null);

        UD09DeleteHdocuserdefinedrulesResponse response = service.deleteSelected(req);
        assertEquals(400, response.getCode());
        assertEquals("请至少选择一条记录", response.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    // -------------------------------------------------------
    // 分支: selectedRecords.isEmpty() → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("deleteSelected - selectedRecords为空列表 → 400")
    void deleteSelected_empty_returns400() {
        UD09DeleteHdocuserdefinedrulesRequest req = new UD09DeleteHdocuserdefinedrulesRequest();
        req.setSelectedRecords(Collections.emptyList());

        UD09DeleteHdocuserdefinedrulesResponse response = service.deleteSelected(req);
        assertEquals(400, response.getCode());
        assertEquals("请至少选择一条记录", response.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    // -------------------------------------------------------
    // 分支: 有选中记录 → 逐条调用deleteByCondition
    // -------------------------------------------------------

    @Test
    @DisplayName("deleteSelected - 多条记录 → 逐条删除")
    void deleteSelected_multipleRecords_deletesEach() {
        UD09DeleteHdocuserdefinedrulesRequest req = new UD09DeleteHdocuserdefinedrulesRequest();

        Map<String, String> rec1 = new HashMap<>();
        rec1.put("pc", "PC1");
        rec1.put("num", "NUM1");
        rec1.put("market", "AUS");

        Map<String, String> rec2 = new HashMap<>();
        rec2.put("pc", "PC2");
        rec2.put("num", "NUM2");
        rec2.put("market", "JPN");

        req.setSelectedRecords(Arrays.asList(rec1, rec2));

        UD09DeleteHdocuserdefinedrulesResponse response = service.deleteSelected(req);
        assertEquals(200, response.getCode());
        assertEquals("记录删除成功", response.getMsg());

        verify(hdocUserDefinedRulesMapper).deleteByCondition("PC1", "NUM1", "AUS");
        verify(hdocUserDefinedRulesMapper).deleteByCondition("PC2", "NUM2", "JPN");
    }

    // -------------------------------------------------------
    // 分支: 单条记录 → 调用一次deleteByCondition
    // -------------------------------------------------------

    @Test
    @DisplayName("deleteSelected - 单条记录 → 删除成功")
    void deleteSelected_singleRecord_deletesOnce() {
        UD09DeleteHdocuserdefinedrulesRequest req = new UD09DeleteHdocuserdefinedrulesRequest();

        Map<String, String> rec = new HashMap<>();
        rec.put("pc", "PC1");
        rec.put("num", "NUM1");
        rec.put("market", "AUS");

        req.setSelectedRecords(Collections.singletonList(rec));

        UD09DeleteHdocuserdefinedrulesResponse response = service.deleteSelected(req);
        assertEquals(200, response.getCode());

        verify(hdocUserDefinedRulesMapper).deleteByCondition("PC1", "NUM1", "AUS");
    }
}
