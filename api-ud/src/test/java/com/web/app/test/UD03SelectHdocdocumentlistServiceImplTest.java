package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD03SelectHdocdocumentlistResponse;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.impl.UD03SelectHdocdocumentlistServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD03SelectHdocdocumentlistServiceImpl 单元测试
 * 覆盖所有分支路径，达到100%分支覆盖率
 */
@ExtendWith(MockitoExtension.class)
class UD03SelectHdocdocumentlistServiceImplTest {

    @Mock
    private HdocDocumentListMapper hdocDocumentListMapper;

    @InjectMocks
    private UD03SelectHdocdocumentlistServiceImpl service;

    // ========================
    // selectHdocdocumentlist() 方法测试
    // ========================

    @Test
    @DisplayName("查询文档列表 - Mapper返回null，应返回成功响应且data.doctypeList为null")
    void selectHdocdocumentlist_DoctypeListIsNull_ShouldReturnSuccessWithNullList() {
        // 准备
        when(hdocDocumentListMapper.selectDoctypeList()).thenReturn(null);

        // 执行
        ApiResponse<UD03SelectHdocdocumentlistResponse> result = service.selectHdocdocumentlist();

        // 验证
        assertNotNull(result);
        assertEquals(200, result.getCode());
        assertEquals("查询成功", result.getMsg());
        assertNotNull(result.getData());
        assertNull(result.getData().getDoctypeList());
        verify(hdocDocumentListMapper, times(1)).selectDoctypeList();
    }

    @Test
    @DisplayName("查询文档列表 - Mapper返回空列表，应返回成功响应且data.doctypeList为空")
    void selectHdocdocumentlist_DoctypeListIsEmpty_ShouldReturnSuccessWithEmptyList() {
        // 准备
        when(hdocDocumentListMapper.selectDoctypeList()).thenReturn(Collections.emptyList());

        // 执行
        ApiResponse<UD03SelectHdocdocumentlistResponse> result = service.selectHdocdocumentlist();

        // 验证
        assertNotNull(result);
        assertEquals(200, result.getCode());
        assertEquals("查询成功", result.getMsg());
        assertNotNull(result.getData());
        assertNotNull(result.getData().getDoctypeList());
        assertTrue(result.getData().getDoctypeList().isEmpty());
        verify(hdocDocumentListMapper, times(1)).selectDoctypeList();
    }

    @Test
    @DisplayName("查询文档列表 - Mapper返回非空列表，应返回成功响应且包含文档类型数据")
    void selectHdocdocumentlist_DoctypeListNotEmpty_ShouldReturnSuccessWithData() {
        // 准备
        List<String> expectedList = Arrays.asList("D1", "D2", "D3");
        when(hdocDocumentListMapper.selectDoctypeList()).thenReturn(expectedList);

        // 执行
        ApiResponse<UD03SelectHdocdocumentlistResponse> result = service.selectHdocdocumentlist();

        // 验证
        assertNotNull(result);
        assertEquals(200, result.getCode());
        assertEquals("查询成功", result.getMsg());
        assertNotNull(result.getData());
        assertNotNull(result.getData().getDoctypeList());
        assertEquals(3, result.getData().getDoctypeList().size());
        assertIterableEquals(expectedList, result.getData().getDoctypeList());
        verify(hdocDocumentListMapper, times(1)).selectDoctypeList();
    }

    @Test
    @DisplayName("查询文档列表 - Mapper抛出异常，应返回500错误响应")
    void selectHdocdocumentlist_MapperThrowsException_ShouldReturnErrorResponse() {
        // 准备
        when(hdocDocumentListMapper.selectDoctypeList()).thenThrow(new RuntimeException("Database connection failed"));

        // 执行
        ApiResponse<UD03SelectHdocdocumentlistResponse> result = service.selectHdocdocumentlist();

        // 验证
        assertNotNull(result);
        assertEquals(500, result.getCode());
        assertEquals("System error. Please contact administrator.", result.getMsg());
        assertNull(result.getData());
        verify(hdocDocumentListMapper, times(1)).selectDoctypeList();
    }
}
