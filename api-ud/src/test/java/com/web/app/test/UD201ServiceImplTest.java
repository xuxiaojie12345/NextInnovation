package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.impl.UD201ServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD201ServiceImpl 单元测试
 * 覆盖所有分支路径，达到100%分支覆盖率
 */
@ExtendWith(MockitoExtension.class)
class UD201ServiceImplTest {

    @Mock
    private HdocDocumentListMapper hdocDocumentListMapper;

    @InjectMocks
    private UD201ServiceImpl service;

    // ============================================================
    // updateHdocDocumentList()
    // ============================================================

    @Test
    @DisplayName("update - doctype不存在（count=0），应返回404")
    void update_DoctypeNotFound_ShouldReturn404() {
        when(hdocDocumentListMapper.countByDoctype("NONEXIST")).thenReturn(0);

        ApiResponse<?> result = service.updateHdocDocumentList("NONEXIST", "admin", "2026-07-20");

        assertEquals(404, result.getCode());
        assertEquals("Document type does not exists. Please enter the correct content.", result.getMsg());
        verify(hdocDocumentListMapper, never()).deleteHdocDocumentList(any());
        verify(hdocDocumentListMapper, never()).insertHdocDocumentList(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("update - 更新成功，应返回200")
    void update_Success_ShouldReturn200() {
        when(hdocDocumentListMapper.countByDoctype("HDOC")).thenReturn(1);
        when(hdocDocumentListMapper.deleteHdocDocumentList("HDOC")).thenReturn(1);
        when(hdocDocumentListMapper.insertHdocDocumentList("HDOC", "admin", "2026-07-20", "admin", "UD20-1_UPDATE"))
                .thenReturn(1);

        ApiResponse<?> result = service.updateHdocDocumentList("HDOC", "admin", "2026-07-20");

        assertEquals(200, result.getCode());
        assertEquals("更新成功", result.getMsg());
        verify(hdocDocumentListMapper, times(1)).deleteHdocDocumentList("HDOC");
        verify(hdocDocumentListMapper, times(1))
                .insertHdocDocumentList("HDOC", "admin", "2026-07-20", "admin", "UD20-1_UPDATE");
    }

    @Test
    @DisplayName("update - 插入返回0，应返回500")
    void update_InsertReturnsZero_ShouldReturn500() {
        when(hdocDocumentListMapper.countByDoctype("HDOC")).thenReturn(1);
        when(hdocDocumentListMapper.deleteHdocDocumentList("HDOC")).thenReturn(1);
        when(hdocDocumentListMapper.insertHdocDocumentList("HDOC", "admin", "2026-07-20", "admin", "UD20-1_UPDATE"))
                .thenReturn(0);

        ApiResponse<?> result = service.updateHdocDocumentList("HDOC", "admin", "2026-07-20");

        assertEquals(500, result.getCode());
        assertEquals("更新失败", result.getMsg());
    }

    @Test
    @DisplayName("update - Mapper异常，应返回500")
    void update_MapperThrowsException_ShouldReturn500() {
        when(hdocDocumentListMapper.countByDoctype("HDOC"))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.updateHdocDocumentList("HDOC", "admin", "2026-07-20");

        assertEquals(500, result.getCode());
        assertEquals("更新失败", result.getMsg());
    }
}
