package com.web.app.test;

import com.web.app.dto.CommonResponse;
import com.web.app.entity.HdocDocumentList;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.impl.SelectHdocdocumentlistServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * SelectHdocdocumentlistServiceImpl 单元测试
 * 覆盖所有分支：null分支、empty分支、正常返回
 * 分支覆盖率达到 100%
 */
@ExtendWith(MockitoExtension.class)
class SelectHdocdocumentlistServiceImplTest {

    @Mock
    private HdocDocumentListMapper hdocDocumentListMapper;

    @InjectMocks
    private SelectHdocdocumentlistServiceImpl service;

    @BeforeEach
    void setUp() {
        // 每个测试前重置Mock
        reset(hdocDocumentListMapper);
    }

    // =========================================================
    // 分支1: documentTypes == null
    // 预期: code=500, msg="Chassis no is not exists"
    // =========================================================

    @Test
    @DisplayName("Mapper返回null → 返回500错误")
    void documentTypesIsNull_returnsError() {
        when(hdocDocumentListMapper.selectAllDocumentTypes()).thenReturn(null);

        CommonResponse response = service.selectHdocdocumentlist();

        assertEquals(500, response.getCode());
        assertEquals("Chassis no is not exists", response.getMsg());
        assertNull(response.getData());
        verify(hdocDocumentListMapper).selectAllDocumentTypes();
    }

    // =========================================================
    // 分支2: documentTypes.isEmpty() == true
    // 预期: code=500, msg="Chassis no is not exists"
    // =========================================================

    @Test
    @DisplayName("Mapper返回空列表 → 返回500错误")
    void documentTypesIsEmpty_returnsError() {
        when(hdocDocumentListMapper.selectAllDocumentTypes()).thenReturn(Collections.emptyList());

        CommonResponse response = service.selectHdocdocumentlist();

        assertEquals(500, response.getCode());
        assertEquals("Chassis no is not exists", response.getMsg());
        assertNull(response.getData());
        verify(hdocDocumentListMapper).selectAllDocumentTypes();
    }

    // =========================================================
    // 分支3: documentTypes != null && !documentTypes.isEmpty()
    // 预期: code=200, msg="查询成功", data包含documentTypes
    // =========================================================

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("Mapper返回有数据的列表 → 返回200及数据")
    void documentTypesHasData_returnsSuccess() {
        HdocDocumentList doc1 = new HdocDocumentList();
        doc1.setDoctype("VIN-PLATE");
        doc1.setDescription("VIN Plate");
        doc1.setRegisterUser("user1");
        doc1.setRegisterDatetime("2026-01-01");

        HdocDocumentList doc2 = new HdocDocumentList();
        doc2.setDoctype("COC");
        doc2.setDescription("Certificate of Conformity");
        doc2.setRegisterUser("user2");
        doc2.setRegisterDatetime("2026-01-02");

        List<HdocDocumentList> docList = Arrays.asList(doc1, doc2);
        when(hdocDocumentListMapper.selectAllDocumentTypes()).thenReturn(docList);

        CommonResponse response = service.selectHdocdocumentlist();

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());
        assertTrue(response.getData() instanceof Map);

        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertTrue(data.containsKey("documentTypes"));
        assertSame(docList, data.get("documentTypes"));
        verify(hdocDocumentListMapper).selectAllDocumentTypes();
    }
}
