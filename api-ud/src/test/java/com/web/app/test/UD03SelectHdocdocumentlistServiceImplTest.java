package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD03SelectHdocdocumentlistResponse;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.impl.UD03SelectHdocdocumentlistServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD03SelectHdocdocumentlistServiceImpl 单元测试
 * 覆盖所有分支：
 * 1. 正常查询-有数据（doctypeList非空）
 * 2. 正常查询-数据为空列表（doctypeList为空列表）
 * 3. 正常查询-数据为null（doctypeList为null）
 * 4. 异常处理-Mapper抛出异常
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD03SelectHdocdocumentlistServiceImpl 单元测试")
class UD03SelectHdocdocumentlistServiceImplTest {

    @Mock
    private HdocDocumentListMapper hdocDocumentListMapper;

    @InjectMocks
    private UD03SelectHdocdocumentlistServiceImpl service;

    private static final String DOC_TYPE_1 = "VIN_PLATE";
    private static final String DOC_TYPE_2 = "COC";
    private static final String DOC_TYPE_3 = "TYPE_APPROVAL";

    @BeforeEach
    void setUp() {
        // 每个测试前重置mock状态
        reset(hdocDocumentListMapper);
    }

    // ============================================================
    // 测试用例1: 正常查询-有数据
    // 覆盖: doctypeList != null && !doctypeList.isEmpty() 分支
    // ============================================================
    @Test
    @DisplayName("正常查询-有数据-doctypeList非空")
    void testSelectHdocdocumentlist_WithData() {
        // Arrange
        List<String> expectedDoctypes = Arrays.asList(DOC_TYPE_1, DOC_TYPE_2, DOC_TYPE_3);
        when(hdocDocumentListMapper.selectDoctypeList()).thenReturn(expectedDoctypes);

        // Act
        ApiResponse<UD03SelectHdocdocumentlistResponse> result = service.selectHdocdocumentlist();

        // Assert
        assertNotNull(result, "返回结果不应为null");
        assertEquals(200, result.getCode().intValue(), "响应码应为200");
        assertEquals("查询成功", result.getMsg(), "响应消息应为'查询成功'");

        // 验证data及其内容
        UD03SelectHdocdocumentlistResponse responseData = result.getData();
        assertNotNull(responseData, "响应数据不应为null");
        assertNotNull(responseData.getDoctypeList(), "文档类型列表不应为null");
        assertEquals(3, responseData.getDoctypeList().size(), "文档类型数量应为3");
        assertEquals(DOC_TYPE_1, responseData.getDoctypeList().get(0), "第一个文档类型应为VIN_PLATE");
        assertEquals(DOC_TYPE_2, responseData.getDoctypeList().get(1), "第二个文档类型应为COC");
        assertEquals(DOC_TYPE_3, responseData.getDoctypeList().get(2), "第三个文档类型应为TYPE_APPROVAL");

        // 验证Mapper被调用一次
        verify(hdocDocumentListMapper, times(1)).selectDoctypeList();
    }

    // ============================================================
    // 测试用例2: 正常查询-数据为空列表
    // 覆盖: doctypeList.isEmpty() 分支（doctypeList为空ArrayList）
    // ============================================================
    @Test
    @DisplayName("正常查询-数据为空列表-doctypeList为空ArrayList")
    void testSelectHdocdocumentlist_EmptyList() {
        // Arrange
        List<String> emptyList = new ArrayList<>();
        when(hdocDocumentListMapper.selectDoctypeList()).thenReturn(emptyList);

        // Act
        ApiResponse<UD03SelectHdocdocumentlistResponse> result = service.selectHdocdocumentlist();

        // Assert
        assertNotNull(result, "返回结果不应为null");
        assertEquals(200, result.getCode().intValue(), "响应码应为200");
        assertEquals("查询成功", result.getMsg(), "响应消息应为'查询成功'");

        // 验证data中的doctypeList为空列表
        UD03SelectHdocdocumentlistResponse responseData = result.getData();
        assertNotNull(responseData, "响应数据不应为null");
        assertNotNull(responseData.getDoctypeList(), "文档类型列表不应为null");
        assertTrue(responseData.getDoctypeList().isEmpty(), "文档类型列表应为空");

        // 验证Mapper被调用一次
        verify(hdocDocumentListMapper, times(1)).selectDoctypeList();
    }

    // ============================================================
    // 测试用例3: 正常查询-数据为null
    // 覆盖: doctypeList == null 分支
    // ============================================================
    @Test
    @DisplayName("正常查询-数据为null-doctypeList为null")
    void testSelectHdocdocumentlist_NullList() {
        // Arrange
        when(hdocDocumentListMapper.selectDoctypeList()).thenReturn(null);

        // Act
        ApiResponse<UD03SelectHdocdocumentlistResponse> result = service.selectHdocdocumentlist();

        // Assert
        assertNotNull(result, "返回结果不应为null");
        assertEquals(200, result.getCode().intValue(), "响应码应为200");
        assertEquals("查询成功", result.getMsg(), "响应消息应为'查询成功'");

        // 验证data存在，但doctypeList为null
        UD03SelectHdocdocumentlistResponse responseData = result.getData();
        assertNotNull(responseData, "响应数据不应为null");
        assertNull(responseData.getDoctypeList(), "文档类型列表应为null");

        // 验证Mapper被调用一次
        verify(hdocDocumentListMapper, times(1)).selectDoctypeList();
    }

    // ============================================================
    // 测试用例4: 异常处理-Mapper抛出异常
    // 覆盖: catch (Exception e) 分支
    // ============================================================
    @Test
    @DisplayName("异常处理-Mapper抛出异常-应返回500错误")
    void testSelectHdocdocumentlist_MapperThrowsException() {
        // Arrange
        String errorMessage = "Database connection failed";
        when(hdocDocumentListMapper.selectDoctypeList())
                .thenThrow(new RuntimeException(errorMessage));

        // Act
        ApiResponse<UD03SelectHdocdocumentlistResponse> result = service.selectHdocdocumentlist();

        // Assert
        assertNotNull(result, "返回结果不应为null");
        assertEquals(500, result.getCode().intValue(), "异常时响应码应为500");
        assertEquals("System error. Please contact administrator.", result.getMsg(), "异常时响应消息应为'System error. Please contact administrator.'");
        assertNull(result.getData(), "异常时data应为null");

        // 验证Mapper被调用一次
        verify(hdocDocumentListMapper, times(1)).selectDoctypeList();
    }

    // ============================================================
    // 测试用例5: 正常查询-单条数据（边界情况）
    // 覆盖: doctypeList.size() = 1 的情况
    // ============================================================
    @Test
    @DisplayName("正常查询-单条数据-doctypeList只有1条记录")
    void testSelectHdocdocumentlist_SingleItem() {
        // Arrange
        List<String> singleItemList = Arrays.asList(DOC_TYPE_1);
        when(hdocDocumentListMapper.selectDoctypeList()).thenReturn(singleItemList);

        // Act
        ApiResponse<UD03SelectHdocdocumentlistResponse> result = service.selectHdocdocumentlist();

        // Assert
        assertNotNull(result, "返回结果不应为null");
        assertEquals(200, result.getCode().intValue(), "响应码应为200");
        assertEquals("查询成功", result.getMsg(), "响应消息应为'查询成功'");

        UD03SelectHdocdocumentlistResponse responseData = result.getData();
        assertNotNull(responseData, "响应数据不应为null");
        assertNotNull(responseData.getDoctypeList(), "文档类型列表不应为null");
        assertEquals(1, responseData.getDoctypeList().size(), "文档类型数量应为1");
        assertEquals(DOC_TYPE_1, responseData.getDoctypeList().get(0), "文档类型应为VIN_PLATE");

        verify(hdocDocumentListMapper, times(1)).selectDoctypeList();
    }

    // ============================================================
    // 测试用例6: 正常查询-大量数据（性能边界）
    // 覆盖: doctypeList包含大量数据的情况
    // ============================================================
    @Test
    @DisplayName("正常查询-大量数据-doctypeList包含多条记录")
    void testSelectHdocdocumentlist_LargeDataSet() {
        // Arrange
        List<String> largeList = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            largeList.add("DOC_TYPE_" + i);
        }
        when(hdocDocumentListMapper.selectDoctypeList()).thenReturn(largeList);

        // Act
        ApiResponse<UD03SelectHdocdocumentlistResponse> result = service.selectHdocdocumentlist();

        // Assert
        assertNotNull(result, "返回结果不应为null");
        assertEquals(200, result.getCode().intValue(), "响应码应为200");
        assertEquals("查询成功", result.getMsg(), "响应消息应为'查询成功'");

        UD03SelectHdocdocumentlistResponse responseData = result.getData();
        assertNotNull(responseData, "响应数据不应为null");
        assertNotNull(responseData.getDoctypeList(), "文档类型列表不应为null");
        assertEquals(100, responseData.getDoctypeList().size(), "文档类型数量应为100");

        verify(hdocDocumentListMapper, times(1)).selectDoctypeList();
    }
}
