package com.web.app.test;

import com.web.app.dto.*;
import com.web.app.entity.HdocDocumentList;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.impl.UD20MarketDocumentSettingsServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD20MarketDocumentSettingsServiceImpl 单元测试
 * 覆盖所有分支：null分支、empty分支、空白分支、正常分支、404分支
 * 分支覆盖率达到 100%
 */
@ExtendWith(MockitoExtension.class)
class UD20MarketDocumentSettingsServiceImplTest {

    @Mock
    private HdocDocumentListMapper hdocDocumentListMapper;

    @InjectMocks
    private UD20MarketDocumentSettingsServiceImpl service;

    @Captor
    private ArgumentCaptor<HdocDocumentList> documentCaptor;

    // =========================================================================
    // selectHdocDocumentList
    // =========================================================================

    // -------------------------------------------------------
    // 分支: documentType为null → selectAllDocumentTypes
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("selectHdocDocumentList - documentType为null → 查询全部")
    void selectList_docTypeNull_selectAll() {
        UD20GetDocumentListRequest req = new UD20GetDocumentListRequest();
        req.setDocumentType(null);

        HdocDocumentList d1 = new HdocDocumentList();
        d1.setDoctype("VIN-PLATE");
        when(hdocDocumentListMapper.selectAllDocumentTypes()).thenReturn(Collections.singletonList(d1));

        UD20GetDocumentListResponse response = service.selectHdocDocumentList(req);
        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());

        Map<String, Object> data = (Map<String, Object>) response.getData();
        @SuppressWarnings("unchecked")
        List<HdocDocumentList> docs = (List<HdocDocumentList>) data.get("documents");
        assertEquals(1, docs.size());

        verify(hdocDocumentListMapper).selectAllDocumentTypes();
        verify(hdocDocumentListMapper, never()).selectByDocumentType(anyString());
    }

    // -------------------------------------------------------
    // 分支: documentType为空串 → selectAllDocumentTypes
    // -------------------------------------------------------

    @Test
    @DisplayName("selectHdocDocumentList - documentType为空串 → 查询全部")
    void selectList_docTypeEmpty_selectAll() {
        UD20GetDocumentListRequest req = new UD20GetDocumentListRequest();
        req.setDocumentType("");

        when(hdocDocumentListMapper.selectAllDocumentTypes()).thenReturn(Collections.emptyList());

        service.selectHdocDocumentList(req);
        verify(hdocDocumentListMapper).selectAllDocumentTypes();
        verify(hdocDocumentListMapper, never()).selectByDocumentType(anyString());
    }

    // -------------------------------------------------------
    // 分支: documentType为空格 → selectAllDocumentTypes
    // -------------------------------------------------------

    @Test
    @DisplayName("selectHdocDocumentList - documentType为空格 → 查询全部")
    void selectList_docTypeBlank_selectAll() {
        UD20GetDocumentListRequest req = new UD20GetDocumentListRequest();
        req.setDocumentType("   ");

        when(hdocDocumentListMapper.selectAllDocumentTypes()).thenReturn(Collections.emptyList());

        service.selectHdocDocumentList(req);
        verify(hdocDocumentListMapper).selectAllDocumentTypes();
    }

    // -------------------------------------------------------
    // 分支: documentType有值 → selectByDocumentType
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("selectHdocDocumentList - documentType有值 → 按类型查询")
    void selectList_docTypeProvided_selectByType() {
        UD20GetDocumentListRequest req = new UD20GetDocumentListRequest();
        req.setDocumentType("VIN-PLATE");

        HdocDocumentList d = new HdocDocumentList();
        d.setDoctype("VIN-PLATE");
        when(hdocDocumentListMapper.selectByDocumentType("VIN-PLATE")).thenReturn(Collections.singletonList(d));

        UD20GetDocumentListResponse response = service.selectHdocDocumentList(req);
        assertEquals(200, response.getCode());

        Map<String, Object> data = (Map<String, Object>) response.getData();
        @SuppressWarnings("unchecked")
        List<HdocDocumentList> docs = (List<HdocDocumentList>) data.get("documents");
        assertEquals(1, docs.size());
        assertEquals("VIN-PLATE", docs.get(0).getDoctype());

        verify(hdocDocumentListMapper).selectByDocumentType("VIN-PLATE");
        verify(hdocDocumentListMapper, never()).selectAllDocumentTypes();
    }

    // =========================================================================
    // updateHdocDocumentList
    // =========================================================================

    // -------------------------------------------------------
    // 分支: documentType为null/empty/blank → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("updateHdocDocumentList - documentType为null → 400")
    void updateList_docTypeNull_returns400() {
        UD20MarketDocumentSettingsRequest req = new UD20MarketDocumentSettingsRequest();
        req.setDocumentType(null);

        UD20MarketDocumentSettingsResponse response = service.updateHdocDocumentList(req);
        assertEquals(400, response.getCode());
        assertEquals("文档类型不能为空", response.getMsg());
        verifyNoInteractions(hdocDocumentListMapper);
    }

    @Test
    @DisplayName("updateHdocDocumentList - documentType为空串 → 400")
    void updateList_docTypeEmpty_returns400() {
        UD20MarketDocumentSettingsRequest req = new UD20MarketDocumentSettingsRequest();
        req.setDocumentType("");

        UD20MarketDocumentSettingsResponse response = service.updateHdocDocumentList(req);
        assertEquals(400, response.getCode());
        verifyNoInteractions(hdocDocumentListMapper);
    }

    @Test
    @DisplayName("updateHdocDocumentList - documentType为空格 → 400")
    void updateList_docTypeBlank_returns400() {
        UD20MarketDocumentSettingsRequest req = new UD20MarketDocumentSettingsRequest();
        req.setDocumentType("   ");

        UD20MarketDocumentSettingsResponse response = service.updateHdocDocumentList(req);
        assertEquals(400, response.getCode());
        verifyNoInteractions(hdocDocumentListMapper);
    }

    // -------------------------------------------------------
    // 分支: list为null → 404 "No data found"
    // -------------------------------------------------------

    @Test
    @DisplayName("updateHdocDocumentList - 查询结果为null → 404")
    void updateList_listNull_returns404() {
        UD20MarketDocumentSettingsRequest req = new UD20MarketDocumentSettingsRequest();
        req.setDocumentType("NONEXISTENT");

        when(hdocDocumentListMapper.selectByDocumentType("NONEXISTENT")).thenReturn(null);

        UD20MarketDocumentSettingsResponse response = service.updateHdocDocumentList(req);
        assertEquals(404, response.getCode());
        assertEquals("No data found", response.getMsg());
        verify(hdocDocumentListMapper, never()).updateDocument(any());
    }

    // -------------------------------------------------------
    // 分支: list为空列表 → 404
    // -------------------------------------------------------

    @Test
    @DisplayName("updateHdocDocumentList - 查询结果为空列表 → 404")
    void updateList_listEmpty_returns404() {
        UD20MarketDocumentSettingsRequest req = new UD20MarketDocumentSettingsRequest();
        req.setDocumentType("NONEXISTENT");

        when(hdocDocumentListMapper.selectByDocumentType("NONEXISTENT")).thenReturn(Collections.emptyList());

        UD20MarketDocumentSettingsResponse response = service.updateHdocDocumentList(req);
        assertEquals(404, response.getCode());
        assertEquals("No data found", response.getMsg());
    }

    // -------------------------------------------------------
    // 分支: 存在 → 更新成功, 返回200
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("updateHdocDocumentList - 存在 → 更新成功, 返回200")
    void updateList_exists_success() {
        UD20MarketDocumentSettingsRequest req = new UD20MarketDocumentSettingsRequest();
        req.setDocumentType("VIN-PLATE");
        req.setBusinessUnit("BU001");
        req.setUser("TEST_USER");
        req.setDate("2026-07-09");

        HdocDocumentList existing = new HdocDocumentList();
        existing.setDoctype("VIN-PLATE");
        when(hdocDocumentListMapper.selectByDocumentType("VIN-PLATE"))
                .thenReturn(Collections.singletonList(existing));

        UD20MarketDocumentSettingsResponse response = service.updateHdocDocumentList(req);
        assertEquals(200, response.getCode());
        assertEquals("更新成功", response.getMsg());

        // 验证update参数
        verify(hdocDocumentListMapper).updateDocument(documentCaptor.capture());
        HdocDocumentList captured = documentCaptor.getValue();
        assertEquals("VIN-PLATE", captured.getDoctype());
        assertEquals("TEST_USER", captured.getRegisterUser());
        assertEquals("2026-07-09", captured.getRegisterDatetime());

        // 验证返回data
        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals("VIN-PLATE", data.get("documentType"));
        assertEquals("BU001", data.get("businessUnit"));
        assertEquals("TEST_USER", data.get("user"));
        assertEquals("2026-07-09", data.get("date"));
    }
}
