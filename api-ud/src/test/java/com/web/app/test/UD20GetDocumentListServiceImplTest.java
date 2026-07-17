package com.web.app.test;

import com.web.app.dto.UD20GetDocumentListRequest;
import com.web.app.dto.UD20GetDocumentListResponse;
import com.web.app.dto.UD20GetDocumentListResponse.DocumentData;
import com.web.app.mapper.UD20GetDocumentListMapper;
import com.web.app.service.impl.UD20GetDocumentListServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD20GetDocumentListServiceImpl 单元测试
 * 覆盖所有分支，达到 100% JaCoCo 覆盖率
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD20GetDocumentListServiceImpl 单元测试")
class UD20GetDocumentListServiceImplTest {

    @Mock
    private UD20GetDocumentListMapper ud20Mapper;

    @InjectMocks
    private UD20GetDocumentListServiceImpl service;

    @Test
    @DisplayName("documentList 为 null 时应返回 success（data 为 null）")
    void testSelectDocumentList_Null() {
        when(ud20Mapper.selectDocumentList(any())).thenReturn(null);

        UD20GetDocumentListResponse response = service.UD20SelectHdocDocumentList(new UD20GetDocumentListRequest());

        assertEquals(200, response.getCode().intValue());
        assertEquals("success", response.getMessage());
        assertNull(response.getData());
        verify(ud20Mapper, times(1)).selectDocumentList(any());
    }

    @Test
    @DisplayName("documentList 为空列表时应返回 success（data 为空列表）")
    void testSelectDocumentList_Empty() {
        when(ud20Mapper.selectDocumentList(any())).thenReturn(Collections.emptyList());

        UD20GetDocumentListResponse response = service.UD20SelectHdocDocumentList(new UD20GetDocumentListRequest());

        assertEquals(200, response.getCode().intValue());
        assertEquals("success", response.getMessage());
        assertNotNull(response.getData());
        assertTrue(response.getData().isEmpty());
        verify(ud20Mapper, times(1)).selectDocumentList(any());
    }

    @Test
    @DisplayName("查询成功时应返回文档列表")
    void testSelectDocumentList_Success() {
        DocumentData doc1 = new DocumentData(1, "Homologation Certificate", "Desc1", "admin", "2026-05-15 10:30:00");
        DocumentData doc2 = new DocumentData(2, "DIM-PLATE", "Desc2", "user01", "2026-06-01 12:00:00");
        when(ud20Mapper.selectDocumentList(any())).thenReturn(Arrays.asList(doc1, doc2));

        UD20GetDocumentListRequest request = new UD20GetDocumentListRequest();
        request.setDoctype("Homologation");

        UD20GetDocumentListResponse response = service.UD20SelectHdocDocumentList(request);

        assertEquals(200, response.getCode().intValue());
        assertEquals("success", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(2, response.getData().size());
        assertEquals("Homologation Certificate", response.getData().get(0).getDocumentType());
        assertEquals("DIM-PLATE", response.getData().get(1).getDocumentType());
        verify(ud20Mapper, times(1)).selectDocumentList(request);
    }

    @Test
    @DisplayName("系统异常时应返回500")
    void testSelectDocumentList_Exception() {
        when(ud20Mapper.selectDocumentList(any())).thenThrow(new RuntimeException("数据库异常"));

        UD20GetDocumentListResponse response = service.UD20SelectHdocDocumentList(new UD20GetDocumentListRequest());

        assertEquals(500, response.getCode().intValue());
        assertEquals("系统繁忙，请稍后重试", response.getMessage());
        assertNull(response.getData());
        verify(ud20Mapper, times(1)).selectDocumentList(any());
    }
}
