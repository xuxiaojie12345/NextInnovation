package com.web.app.test;

import com.web.app.dto.UD03SelectHdocdocumentlistResponse;
import com.web.app.mapper.UD03SelectHdocdocumentlistMapper;
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
 * 覆盖所有分支以达到 100% 的 JaCoCo 覆盖率
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD03SelectHdocdocumentlistServiceImpl 单元测试")
class UD03SelectHdocdocumentlistServiceImplTest {

    @Mock
    private UD03SelectHdocdocumentlistMapper ud03Mapper;

    @InjectMocks
    private UD03SelectHdocdocumentlistServiceImpl service;

    // ==================== 分支1: doctypeList 为 null ====================

    @Test
    @DisplayName("查询结果为 null 时应返回空列表成功响应")
    void testGetHdocDocumentList_ListIsNull() {
        when(ud03Mapper.selectDoctypeList()).thenReturn(null);

        UD03SelectHdocdocumentlistResponse response = service.getHdocDocumentList();

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNull(response.getData());
        verify(ud03Mapper, times(1)).selectDoctypeList();
    }

    // ==================== 分支2: doctypeList 为空列表 ====================

    @Test
    @DisplayName("查询结果为空列表时应返回空列表成功响应")
    void testGetHdocDocumentList_ListIsEmpty() {
        when(ud03Mapper.selectDoctypeList()).thenReturn(Collections.emptyList());

        UD03SelectHdocdocumentlistResponse response = service.getHdocDocumentList();

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());
        assertTrue(response.getData().isEmpty());
        verify(ud03Mapper, times(1)).selectDoctypeList();
    }

    // ==================== 分支3: 正常返回数据 ====================

    @Test
    @DisplayName("查询到文档类型列表时应返回成功响应")
    void testGetHdocDocumentList_Success() {
        List<String> mockList = Arrays.asList("DIM-PLATE", "TYPE-PLATE", "VIN-PLATE");
        when(ud03Mapper.selectDoctypeList()).thenReturn(mockList);

        UD03SelectHdocdocumentlistResponse response = service.getHdocDocumentList();

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());
        assertEquals(3, response.getData().size());
        assertEquals("DIM-PLATE", response.getData().get(0));
        verify(ud03Mapper, times(1)).selectDoctypeList();
    }

    // ==================== 分支4: 系统异常 ====================

    @Test
    @DisplayName("系统异常时应返回500错误响应")
    void testGetHdocDocumentList_Exception() {
        when(ud03Mapper.selectDoctypeList()).thenThrow(new RuntimeException("数据库连接失败"));

        UD03SelectHdocdocumentlistResponse response = service.getHdocDocumentList();

        assertEquals(500, response.getCode());
        assertEquals("System error. Please try again later.", response.getMsg());
        verify(ud03Mapper, times(1)).selectDoctypeList();
    }
}
