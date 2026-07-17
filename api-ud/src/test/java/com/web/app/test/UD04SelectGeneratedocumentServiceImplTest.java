package com.web.app.test;

import com.web.app.dto.UD04SelectGeneratedocumentResponse;
import com.web.app.entity.UD04GenerateDocumentVO;
import com.web.app.mapper.UD04SelectGeneratedocumentMapper;
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
 * 覆盖 validateParameters 所有分支及业务逻辑所有分支，达到 100% JaCoCo 覆盖率
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD04SelectGeneratedocumentServiceImpl 单元测试")
class UD04SelectGeneratedocumentServiceImplTest {

    @Mock
    private UD04SelectGeneratedocumentMapper ud04Mapper;

    @InjectMocks
    private UD04SelectGeneratedocumentServiceImpl service;

    // ==================== 参数校验分支: chassisSerie ====================

    @Test
    @DisplayName("chassisSerie 为 null/空时应返回400")
    void testValidate_ChassisSerieEmpty() {
        UD04SelectGeneratedocumentResponse response = service.getUD04GenerateDocumentData(null, "12345");
        assertEquals(400, response.getCode());
        assertEquals("Chassis serie is required.", response.getMsg());
        assertNull(response.getData());

        response = service.getUD04GenerateDocumentData("", "12345");
        assertEquals(400, response.getCode());
        assertEquals("Chassis serie is required.", response.getMsg());
    }

    @Test
    @DisplayName("chassisSerie 超过5字符时应返回400")
    void testValidate_ChassisSerieTooLong() {
        UD04SelectGeneratedocumentResponse response = service.getUD04GenerateDocumentData("ABCDEF", "12345");
        assertEquals(400, response.getCode());
        assertEquals("Chassis serie must be at most 5 characters.", response.getMsg());
    }

    @Test
    @DisplayName("chassisSerie 包含非英数字符时应返回400")
    void testValidate_ChassisSerieInvalidChars() {
        UD04SelectGeneratedocumentResponse response = service.getUD04GenerateDocumentData("AB-12", "12345");
        assertEquals(400, response.getCode());
        assertEquals("Chassis serie must contain only alphanumeric characters.", response.getMsg());
    }

    // ==================== 参数校验分支: chassisNo ====================

    @Test
    @DisplayName("chassisNo 为 null/空时应返回400")
    void testValidate_ChassisNoEmpty() {
        UD04SelectGeneratedocumentResponse response = service.getUD04GenerateDocumentData("ABC12", null);
        assertEquals(400, response.getCode());
        assertEquals("Chassis no is required.", response.getMsg());

        response = service.getUD04GenerateDocumentData("ABC12", "");
        assertEquals(400, response.getCode());
        assertEquals("Chassis no is required.", response.getMsg());
    }

    @Test
    @DisplayName("chassisNo 超过10字符时应返回400")
    void testValidate_ChassisNoTooLong() {
        UD04SelectGeneratedocumentResponse response = service.getUD04GenerateDocumentData("ABC12", "12345678901");
        assertEquals(400, response.getCode());
        assertEquals("Chassis no must be at most 10 characters.", response.getMsg());
    }

    @Test
    @DisplayName("chassisNo 包含非数字字符时应返回400")
    void testValidate_ChassisNoInvalidChars() {
        UD04SelectGeneratedocumentResponse response = service.getUD04GenerateDocumentData("ABC12", "1234A");
        assertEquals(400, response.getCode());
        assertEquals("Chassis no must contain only digits.", response.getMsg());
    }

    // ==================== 分支: documentData 为 null ====================

    @Test
    @DisplayName("查询结果为空时应返回404")
    void testGetUD04GenerateDocumentData_DataNotFound() {
        when(ud04Mapper.selectDocumentData("ABC12", "12345")).thenReturn(null);

        UD04SelectGeneratedocumentResponse response = service.getUD04GenerateDocumentData("ABC12", "12345");

        assertEquals(404, response.getCode());
        assertEquals("We can not get the data. Please try again.", response.getMsg());
        assertNull(response.getData());
        verify(ud04Mapper, times(1)).selectDocumentData("ABC12", "12345");
    }

    // ==================== 分支: 正常成功 ====================

    @Test
    @DisplayName("查询成功时应返回200及文档数据")
    void testGetUD04GenerateDocumentData_Success() {
        UD04GenerateDocumentVO mockVO = new UD04GenerateDocumentVO();
        mockVO.setOrdernumber("ORD123456");
        mockVO.setBuild(12);
        mockVO.setSpec(45);
        mockVO.setCustomerAdap("EU-STD");
        mockVO.setCountryOfOperation("DE");
        mockVO.setLoadIndex("91V");
        mockVO.setAct("Y");
        mockVO.setVariable("VAR001");

        when(ud04Mapper.selectDocumentData("ABC12", "12345")).thenReturn(mockVO);

        UD04SelectGeneratedocumentResponse response = service.getUD04GenerateDocumentData("ABC12", "12345");

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());
        assertEquals("ORD123456", response.getData().getOrdernumber());
        assertEquals(12, response.getData().getBuild());
        assertEquals(45, response.getData().getSpec());
        assertEquals("EU-STD", response.getData().getCustomerAdap());
        assertEquals("DE", response.getData().getCountryOfOperation());
        assertEquals("91V", response.getData().getLoadIndex());
        assertEquals("Y", response.getData().getAct());
        assertEquals("VAR001", response.getData().getVariable());
        verify(ud04Mapper, times(1)).selectDocumentData("ABC12", "12345");
    }

    // ==================== 分支: 系统异常 ====================

    @Test
    @DisplayName("系统异常时应返回500")
    void testGetUD04GenerateDocumentData_Exception() {
        when(ud04Mapper.selectDocumentData(anyString(), anyString()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD04SelectGeneratedocumentResponse response = service.getUD04GenerateDocumentData("ABC12", "12345");

        assertEquals(500, response.getCode());
        assertEquals("System error. Please try again later.", response.getMsg());
        assertNull(response.getData());
        verify(ud04Mapper, times(1)).selectDocumentData("ABC12", "12345");
    }
}
