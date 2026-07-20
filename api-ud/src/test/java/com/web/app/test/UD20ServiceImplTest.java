package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.impl.UD20ServiceImpl;
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
 * UD20ServiceImpl 单元测试
 * 覆盖所有分支路径，达到100%分支覆盖率
 */
@ExtendWith(MockitoExtension.class)
class UD20ServiceImplTest {

    @Mock
    private HdocDocumentListMapper hdocDocumentListMapper;

    @InjectMocks
    private UD20ServiceImpl service;

    // ============================================================
    // getDocumentList()
    // ============================================================

    @Test
    @DisplayName("getDocumentList - 正常返回文档列表")
    void getDocumentList_Success_ShouldReturnList() {
        Map<String, Object> doc = new HashMap<>();
        doc.put("doctype", "HDOC");
        doc.put("description", "Homologation Document");
        when(hdocDocumentListMapper.selectDocumentTypeList()).thenReturn(Arrays.asList(doc));

        ApiResponse<?> result = service.getDocumentList();

        assertEquals(200, result.getCode());
        assertEquals("获取文档列表成功", result.getMsg());
        assertNotNull(result.getData());
    }

    @Test
    @DisplayName("getDocumentList - Mapper返回null，应返回404")
    void getDocumentList_ListNull_ShouldReturn404() {
        when(hdocDocumentListMapper.selectDocumentTypeList()).thenReturn(null);

        ApiResponse<?> result = service.getDocumentList();

        assertEquals(404, result.getCode());
        assertEquals("文档列表为空", result.getMsg());
    }

    @Test
    @DisplayName("getDocumentList - Mapper返回空列表，应返回404")
    void getDocumentList_ListEmpty_ShouldReturn404() {
        when(hdocDocumentListMapper.selectDocumentTypeList()).thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.getDocumentList();

        assertEquals(404, result.getCode());
    }

    @Test
    @DisplayName("getDocumentList - Mapper异常，应返回500")
    void getDocumentList_MapperThrowsException_ShouldReturn500() {
        when(hdocDocumentListMapper.selectDocumentTypeList())
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.getDocumentList();

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // searchDocumentList()
    // ============================================================

    @Test
    @DisplayName("searchDocumentList - 正常返回搜索结果")
    void searchDocumentList_Success_ShouldReturnList() {
        Map<String, Object> doc = new HashMap<>();
        doc.put("doctype", "HDOC");
        when(hdocDocumentListMapper.searchDocumentTypeList("HDOC", "="))
                .thenReturn(Arrays.asList(doc));

        ApiResponse<?> result = service.searchDocumentList("HDOC", "=");

        assertEquals(200, result.getCode());
        assertEquals("获取文档列表成功", result.getMsg());
        assertNotNull(result.getData());
        verify(hdocDocumentListMapper, times(1)).searchDocumentTypeList("HDOC", "=");
    }

    @Test
    @DisplayName("searchDocumentList - Mapper返回null，应返回404")
    void searchDocumentList_ListNull_ShouldReturn404() {
        when(hdocDocumentListMapper.searchDocumentTypeList("NONEXIST", "="))
                .thenReturn(null);

        ApiResponse<?> result = service.searchDocumentList("NONEXIST", "=");

        assertEquals(404, result.getCode());
        assertEquals("No data found", result.getMsg());
    }

    @Test
    @DisplayName("searchDocumentList - Mapper返回空列表，应返回404")
    void searchDocumentList_ListEmpty_ShouldReturn404() {
        when(hdocDocumentListMapper.searchDocumentTypeList("HDOC", "="))
                .thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.searchDocumentList("HDOC", "=");

        assertEquals(404, result.getCode());
    }

    @Test
    @DisplayName("searchDocumentList - Mapper异常，应返回500")
    void searchDocumentList_MapperThrowsException_ShouldReturn500() {
        when(hdocDocumentListMapper.searchDocumentTypeList("HDOC", "="))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.searchDocumentList("HDOC", "=");

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }
}
