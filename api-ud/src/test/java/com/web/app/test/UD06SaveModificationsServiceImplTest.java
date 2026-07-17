package com.web.app.test;

import com.web.app.dto.UD06SaveModificationsRequest;
import com.web.app.dto.UD06SaveModificationsResponse;
import com.web.app.entity.UD06SaveModificationsVO;
import com.web.app.mapper.UD06SaveModificationsMapper;
import com.web.app.service.impl.UD06SaveModificationsServiceImpl;
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
 * UD06SaveModificationsServiceImpl 单元测试
 * 覆盖 validateRequest 所有分支及业务逻辑所有分支，达到 100% JaCoCo 覆盖率
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD06SaveModificationsServiceImpl 单元测试")
class UD06SaveModificationsServiceImplTest {

    @Mock
    private UD06SaveModificationsMapper ud06Mapper;

    @InjectMocks
    private UD06SaveModificationsServiceImpl service;

    // ==================== 参数校验分支: request ====================

    @Test
    @DisplayName("request 为 null 时应返回400")
    void testValidate_RequestNull() {
        UD06SaveModificationsResponse response = service.UD06SelectHdocAdcaModification(null);
        assertEquals(400, response.getCode());
        assertEquals("Request is required.", response.getMsg());
    }

    // ==================== 参数校验分支: chassisSerie ====================

    @Test
    @DisplayName("chassisSerie 为 null/空时应返回400")
    void testValidate_ChassisSerieEmpty() {
        UD06SaveModificationsRequest request = new UD06SaveModificationsRequest(null, "12345", null);
        UD06SaveModificationsResponse response = service.UD06SelectHdocAdcaModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Chassis serie is required.", response.getMsg());

        request = new UD06SaveModificationsRequest("", "12345", null);
        response = service.UD06SelectHdocAdcaModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Chassis serie is required.", response.getMsg());
    }

    @Test
    @DisplayName("chassisSerie 超过5字符时应返回400")
    void testValidate_ChassisSerieTooLong() {
        UD06SaveModificationsRequest request = new UD06SaveModificationsRequest("ABCDEF", "12345", null);
        UD06SaveModificationsResponse response = service.UD06SelectHdocAdcaModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Chassis serie must be at most 5 characters.", response.getMsg());
    }

    @Test
    @DisplayName("chassisSerie 包含非英数字符时应返回400")
    void testValidate_ChassisSerieInvalidChars() {
        UD06SaveModificationsRequest request = new UD06SaveModificationsRequest("AB-12", "12345", null);
        UD06SaveModificationsResponse response = service.UD06SelectHdocAdcaModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Chassis serie must contain only alphanumeric characters.", response.getMsg());
    }

    // ==================== 参数校验分支: chassisNo ====================

    @Test
    @DisplayName("chassisNo 为 null/空时应返回400")
    void testValidate_ChassisNoEmpty() {
        UD06SaveModificationsRequest request = new UD06SaveModificationsRequest("JPCT", null, null);
        UD06SaveModificationsResponse response = service.UD06SelectHdocAdcaModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Chassis no is required.", response.getMsg());

        request = new UD06SaveModificationsRequest("JPCT", "", null);
        response = service.UD06SelectHdocAdcaModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Chassis no is required.", response.getMsg());
    }

    @Test
    @DisplayName("chassisNo 超过10字符时应返回400")
    void testValidate_ChassisNoTooLong() {
        UD06SaveModificationsRequest request = new UD06SaveModificationsRequest("JPCT", "12345678901", null);
        UD06SaveModificationsResponse response = service.UD06SelectHdocAdcaModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Chassis no must be at most 10 characters.", response.getMsg());
    }

    @Test
    @DisplayName("chassisNo 包含非数字字符时应返回400")
    void testValidate_ChassisNoInvalidChars() {
        UD06SaveModificationsRequest request = new UD06SaveModificationsRequest("JPCT", "1234A", null);
        UD06SaveModificationsResponse response = service.UD06SelectHdocAdcaModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Chassis no must contain only digits.", response.getMsg());
    }

    // ==================== 分支: voList 为 null ====================

    @Test
    @DisplayName("查询结果 voList 为 null 时应返回404")
    void testSelectHdocAdcaModification_VoListNull() {
        when(ud06Mapper.selectHdocAdcaModification("JPCT", "028321", null)).thenReturn(null);

        UD06SaveModificationsRequest request = new UD06SaveModificationsRequest("JPCT", "028321", null);
        UD06SaveModificationsResponse response = service.UD06SelectHdocAdcaModification(request);

        assertEquals(404, response.getCode());
        assertEquals("Record not found.", response.getMsg());
        assertNull(response.getData());
        verify(ud06Mapper, times(1)).selectHdocAdcaModification("JPCT", "028321", null);
    }

    // ==================== 分支: voList 为空列表 ====================

    @Test
    @DisplayName("查询结果 voList 为空列表时应返回404")
    void testSelectHdocAdcaModification_VoListEmpty() {
        when(ud06Mapper.selectHdocAdcaModification("JPCT", "028321", null))
                .thenReturn(Collections.emptyList());

        UD06SaveModificationsRequest request = new UD06SaveModificationsRequest("JPCT", "028321", null);
        UD06SaveModificationsResponse response = service.UD06SelectHdocAdcaModification(request);

        assertEquals(404, response.getCode());
        assertEquals("Record not found.", response.getMsg());
        assertNull(response.getData());
        verify(ud06Mapper, times(1)).selectHdocAdcaModification("JPCT", "028321", null);
    }

    // ==================== 分支: 正常成功（含 variables 参数）====================

    @Test
    @DisplayName("查询成功时应返回200及保存修改内容数据")
    void testSelectHdocAdcaModification_Success() {
        List<String> variables = Arrays.asList("SEAT_NO_4", "MAT_COLOR");
        UD06SaveModificationsVO mockVO = new UD06SaveModificationsVO();
        mockVO.setDoctype("DIM-PLATE");
        mockVO.setVers("1");
        mockVO.setVariable("SEAT_NO_4");
        mockVO.setNewVal("NEW_VALUE");

        when(ud06Mapper.selectHdocAdcaModification("JPCT", "028321", variables))
                .thenReturn(Collections.singletonList(mockVO));

        UD06SaveModificationsRequest request = new UD06SaveModificationsRequest("JPCT", "028321", variables);
        UD06SaveModificationsResponse response = service.UD06SelectHdocAdcaModification(request);

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());
        assertEquals("DIM-PLATE", response.getData().getDoctype());
        assertEquals("1", response.getData().getVers());
        assertEquals("SEAT_NO_4", response.getData().getVariable());
        assertEquals("NEW_VALUE", response.getData().getNewVal());
        verify(ud06Mapper, times(1)).selectHdocAdcaModification("JPCT", "028321", variables);
    }

    // ==================== 分支: 系统异常 ====================

    @Test
    @DisplayName("系统异常时应返回500")
    void testSelectHdocAdcaModification_Exception() {
        when(ud06Mapper.selectHdocAdcaModification(anyString(), anyString(), any()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD06SaveModificationsRequest request = new UD06SaveModificationsRequest("JPCT", "028321", null);
        UD06SaveModificationsResponse response = service.UD06SelectHdocAdcaModification(request);

        assertEquals(500, response.getCode());
        assertEquals("System error. Please try again later.", response.getMsg());
        assertNull(response.getData());
        verify(ud06Mapper, times(1)).selectHdocAdcaModification("JPCT", "028321", null);
    }
}
