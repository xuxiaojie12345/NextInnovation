package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD04SelectGeneratedocumentRequest;
import com.web.app.domain.UD04SelectGeneratedocumentResponse;
import com.web.app.mapper.HdocGeneratedocumentMapper;
import com.web.app.service.impl.UD04SelectGeneratedocumentServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD04SelectGeneratedocumentServiceImpl 单元测试
 * 覆盖所有分支路径，达到100%分支覆盖率
 */
@ExtendWith(MockitoExtension.class)
class UD04SelectGeneratedocumentServiceImplTest {

    @Mock
    private HdocGeneratedocumentMapper hdocGeneratedocumentMapper;

    @InjectMocks
    private UD04SelectGeneratedocumentServiceImpl service;

    // =====================================================
    // validateRequest() 参数校验分支测试（通过公共方法触发）
    // =====================================================

    @Test
    @DisplayName("参数校验 - chassisSeries为null，应返回400错误")
    void selectGeneratedocument_ChassisSeriesNull_ShouldReturnError() {
        // 准备
        UD04SelectGeneratedocumentRequest request = new UD04SelectGeneratedocumentRequest();
        request.setChassisSeries(null);
        request.setChassisNo("ABC123");

        // 执行
        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(request);

        // 验证
        assertNotNull(result);
        assertEquals(400, result.getCode());
        assertEquals("Chassis series is required.", result.getMsg());
        verifyNoInteractions(hdocGeneratedocumentMapper);
    }

    @Test
    @DisplayName("参数校验 - chassisSeries为空字符串，应返回400错误")
    void selectGeneratedocument_ChassisSeriesEmpty_ShouldReturnError() {
        // 准备
        UD04SelectGeneratedocumentRequest request = new UD04SelectGeneratedocumentRequest();
        request.setChassisSeries("");
        request.setChassisNo("ABC123");

        // 执行
        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(request);

        // 验证
        assertNotNull(result);
        assertEquals(400, result.getCode());
        assertEquals("Chassis series is required.", result.getMsg());
        verifyNoInteractions(hdocGeneratedocumentMapper);
    }

    @Test
    @DisplayName("参数校验 - chassisSeries为空白字符串（仅空格），应返回400错误")
    void selectGeneratedocument_ChassisSeriesBlank_ShouldReturnError() {
        // 准备
        UD04SelectGeneratedocumentRequest request = new UD04SelectGeneratedocumentRequest();
        request.setChassisSeries("   ");
        request.setChassisNo("ABC123");

        // 执行
        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(request);

        // 验证
        assertNotNull(result);
        assertEquals(400, result.getCode());
        assertEquals("Chassis series is required.", result.getMsg());
        verifyNoInteractions(hdocGeneratedocumentMapper);
    }

    @Test
    @DisplayName("参数校验 - chassisSeries长度不等于4，应返回400错误")
    void selectGeneratedocument_ChassisSeriesLengthNot4_ShouldReturnError() {
        // 准备
        UD04SelectGeneratedocumentRequest request = new UD04SelectGeneratedocumentRequest();
        request.setChassisSeries("ABC");   // 长度3
        request.setChassisNo("ABC123");

        // 执行
        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(request);

        // 验证
        assertNotNull(result);
        assertEquals(400, result.getCode());
        assertEquals("Chassis series must be 4 characters.", result.getMsg());
        verifyNoInteractions(hdocGeneratedocumentMapper);
    }

    @Test
    @DisplayName("参数校验 - chassisNo为null，应返回400错误")
    void selectGeneratedocument_ChassisNoNull_ShouldReturnError() {
        // 准备
        UD04SelectGeneratedocumentRequest request = new UD04SelectGeneratedocumentRequest();
        request.setChassisSeries("ABCD");
        request.setChassisNo(null);

        // 执行
        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(request);

        // 验证
        assertNotNull(result);
        assertEquals(400, result.getCode());
        assertEquals("Chassis no is required.", result.getMsg());
        verifyNoInteractions(hdocGeneratedocumentMapper);
    }

    @Test
    @DisplayName("参数校验 - chassisNo为空字符串，应返回400错误")
    void selectGeneratedocument_ChassisNoEmpty_ShouldReturnError() {
        // 准备
        UD04SelectGeneratedocumentRequest request = new UD04SelectGeneratedocumentRequest();
        request.setChassisSeries("ABCD");
        request.setChassisNo("");

        // 执行
        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(request);

        // 验证
        assertNotNull(result);
        assertEquals(400, result.getCode());
        assertEquals("Chassis no is required.", result.getMsg());
        verifyNoInteractions(hdocGeneratedocumentMapper);
    }

    @Test
    @DisplayName("参数校验 - chassisNo为空白字符串（仅空格），应返回400错误")
    void selectGeneratedocument_ChassisNoBlank_ShouldReturnError() {
        // 准备
        UD04SelectGeneratedocumentRequest request = new UD04SelectGeneratedocumentRequest();
        request.setChassisSeries("ABCD");
        request.setChassisNo("   ");

        // 执行
        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(request);

        // 验证
        assertNotNull(result);
        assertEquals(400, result.getCode());
        assertEquals("Chassis no is required.", result.getMsg());
        verifyNoInteractions(hdocGeneratedocumentMapper);
    }

    @Test
    @DisplayName("参数校验 - chassisNo超过10个字符，应返回400错误")
    void selectGeneratedocument_ChassisNoTooLong_ShouldReturnError() {
        // 准备
        UD04SelectGeneratedocumentRequest request = new UD04SelectGeneratedocumentRequest();
        request.setChassisSeries("ABCD");
        request.setChassisNo("12345678901");  // 11 characters

        // 执行
        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(request);

        // 验证
        assertNotNull(result);
        assertEquals(400, result.getCode());
        assertEquals("Chassis no must not exceed 10 characters.", result.getMsg());
        verifyNoInteractions(hdocGeneratedocumentMapper);
    }

    @Test
    @DisplayName("参数校验 - chassisSeries包含非法字符，应返回400错误")
    void selectGeneratedocument_ChassisSeriesInvalidChars_ShouldReturnError() {
        // 准备
        UD04SelectGeneratedocumentRequest request = new UD04SelectGeneratedocumentRequest();
        request.setChassisSeries("AB_D");   // contains underscore
        request.setChassisNo("123456");

        // 执行
        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(request);

        // 验证
        assertNotNull(result);
        assertEquals(400, result.getCode());
        assertEquals("Chassis series contains invalid characters.", result.getMsg());
        verifyNoInteractions(hdocGeneratedocumentMapper);
    }

    @Test
    @DisplayName("参数校验 - chassisNo包含非法字符，应返回400错误")
    void selectGeneratedocument_ChassisNoInvalidChars_ShouldReturnError() {
        // 准备
        UD04SelectGeneratedocumentRequest request = new UD04SelectGeneratedocumentRequest();
        request.setChassisSeries("ABCD");
        request.setChassisNo("123-456");   // contains hyphen

        // 执行
        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(request);

        // 验证
        assertNotNull(result);
        assertEquals(400, result.getCode());
        assertEquals("Chassis no contains invalid characters.", result.getMsg());
        verifyNoInteractions(hdocGeneratedocumentMapper);
    }

    // =====================================================
    // selectGeneratedocument() 数据库查询分支测试
    // =====================================================

    @Test
    @DisplayName("查询 - Mapper返回null（底盘未找到），应返回404错误")
    void selectGeneratedocument_MapperReturnsNull_ShouldReturn404() {
        // 准备
        UD04SelectGeneratedocumentRequest request = new UD04SelectGeneratedocumentRequest();
        request.setChassisSeries("ABCD");
        request.setChassisNo("123456");
        when(hdocGeneratedocumentMapper.selectGeneratedocument("ABCD", "123456")).thenReturn(null);

        // 执行
        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(request);

        // 验证
        assertNotNull(result);
        assertEquals(404, result.getCode());
        assertEquals("Chassis not found", result.getMsg());
        assertNull(result.getData());
        verify(hdocGeneratedocumentMapper, times(1)).selectGeneratedocument("ABCD", "123456");
    }

    @Test
    @DisplayName("查询 - Mapper返回数据，应返回200成功响应")
    void selectGeneratedocument_MapperReturnsData_ShouldReturnSuccess() {
        // 准备
        UD04SelectGeneratedocumentRequest request = new UD04SelectGeneratedocumentRequest();
        request.setChassisSeries("ABCD");
        request.setChassisNo("123456");

        UD04SelectGeneratedocumentResponse mockResponse = UD04SelectGeneratedocumentResponse.builder()
                .serie("ABCD")
                .chnr("123456")
                .ordernumber("ORD-001")
                .build();
        when(hdocGeneratedocumentMapper.selectGeneratedocument("ABCD", "123456")).thenReturn(mockResponse);

        // 执行
        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(request);

        // 验证
        assertNotNull(result);
        assertEquals(200, result.getCode());
        assertEquals("查询成功", result.getMsg());
        assertNotNull(result.getData());
        assertEquals("ABCD", result.getData().getSerie());
        assertEquals("123456", result.getData().getChnr());
        assertEquals("ORD-001", result.getData().getOrdernumber());
        verify(hdocGeneratedocumentMapper, times(1)).selectGeneratedocument("ABCD", "123456");
    }

    @Test
    @DisplayName("查询 - Mapper抛出异常，应返回500错误响应")
    void selectGeneratedocument_MapperThrowsException_ShouldReturn500() {
        // 准备
        UD04SelectGeneratedocumentRequest request = new UD04SelectGeneratedocumentRequest();
        request.setChassisSeries("ABCD");
        request.setChassisNo("123456");
        when(hdocGeneratedocumentMapper.selectGeneratedocument("ABCD", "123456"))
                .thenThrow(new RuntimeException("Database error"));

        // 执行
        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(request);

        // 验证
        assertNotNull(result);
        assertEquals(500, result.getCode());
        assertEquals("System error. Please contact administrator.", result.getMsg());
        assertNull(result.getData());
        verify(hdocGeneratedocumentMapper, times(1)).selectGeneratedocument("ABCD", "123456");
    }
}
