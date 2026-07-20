package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD06SaveModificationsRequest;
import com.web.app.domain.UD06SaveModificationsResponse;
import com.web.app.mapper.HdocModificationsMapper;
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
 * 覆盖所有分支路径，达到100%分支覆盖率
 */
@ExtendWith(MockitoExtension.class)
class UD06SaveModificationsServiceImplTest {

    @Mock
    private HdocModificationsMapper hdocModificationsMapper;

    @InjectMocks
    private UD06SaveModificationsServiceImpl service;

    // ============================================================
    // saveModifications() — validateRequest 参数校验分支
    // ============================================================

    @Test
    @DisplayName("参数校验 - chassisSerie为null，应返回400")
    void saveModifications_ChassisSerieNull_ShouldReturn400() {
        UD06SaveModificationsRequest request = UD06SaveModificationsRequest.builder()
                .chassisSerie(null)
                .chassisNo("123456")
                .build();

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(request);

        assertEquals(400, result.getCode());
        assertEquals("Chassis serie不能为空", result.getMsg());
        verifyNoInteractions(hdocModificationsMapper);
    }

    @Test
    @DisplayName("参数校验 - chassisSerie为空字符串，应返回400")
    void saveModifications_ChassisSerieEmpty_ShouldReturn400() {
        UD06SaveModificationsRequest request = UD06SaveModificationsRequest.builder()
                .chassisSerie("")
                .chassisNo("123456")
                .build();

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(request);

        assertEquals(400, result.getCode());
        assertEquals("Chassis serie不能为空", result.getMsg());
        verifyNoInteractions(hdocModificationsMapper);
    }

    @Test
    @DisplayName("参数校验 - chassisSerie为空白字符串，应返回400")
    void saveModifications_ChassisSerieBlank_ShouldReturn400() {
        UD06SaveModificationsRequest request = UD06SaveModificationsRequest.builder()
                .chassisSerie("   ")
                .chassisNo("123456")
                .build();

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(request);

        assertEquals(400, result.getCode());
        assertEquals("Chassis serie不能为空", result.getMsg());
        verifyNoInteractions(hdocModificationsMapper);
    }

    @Test
    @DisplayName("参数校验 - chassisSerie长度不等于4，应返回400")
    void saveModifications_ChassisSerieLengthNot4_ShouldReturn400() {
        UD06SaveModificationsRequest request = UD06SaveModificationsRequest.builder()
                .chassisSerie("ABC")
                .chassisNo("123456")
                .build();

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(request);

        assertEquals(400, result.getCode());
        assertEquals("Chassis serie长度必须为4位", result.getMsg());
        verifyNoInteractions(hdocModificationsMapper);
    }

    @Test
    @DisplayName("参数校验 - chassisNo为null，应返回400")
    void saveModifications_ChassisNoNull_ShouldReturn400() {
        UD06SaveModificationsRequest request = UD06SaveModificationsRequest.builder()
                .chassisSerie("ABCD")
                .chassisNo(null)
                .build();

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(request);

        assertEquals(400, result.getCode());
        assertEquals("Chassis no不能为空", result.getMsg());
        verifyNoInteractions(hdocModificationsMapper);
    }

    @Test
    @DisplayName("参数校验 - chassisNo为空字符串，应返回400")
    void saveModifications_ChassisNoEmpty_ShouldReturn400() {
        UD06SaveModificationsRequest request = UD06SaveModificationsRequest.builder()
                .chassisSerie("ABCD")
                .chassisNo("")
                .build();

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(request);

        assertEquals(400, result.getCode());
        assertEquals("Chassis no不能为空", result.getMsg());
        verifyNoInteractions(hdocModificationsMapper);
    }

    @Test
    @DisplayName("参数校验 - chassisNo为空白字符串，应返回400")
    void saveModifications_ChassisNoBlank_ShouldReturn400() {
        UD06SaveModificationsRequest request = UD06SaveModificationsRequest.builder()
                .chassisSerie("ABCD")
                .chassisNo("   ")
                .build();

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(request);

        assertEquals(400, result.getCode());
        assertEquals("Chassis no不能为空", result.getMsg());
        verifyNoInteractions(hdocModificationsMapper);
    }

    @Test
    @DisplayName("参数校验 - chassisNo包含非法字符，应返回400")
    void saveModifications_ChassisNoInvalidChars_ShouldReturn400() {
        UD06SaveModificationsRequest request = UD06SaveModificationsRequest.builder()
                .chassisSerie("ABCD")
                .chassisNo("123-456")
                .build();

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(request);

        assertEquals(400, result.getCode());
        assertEquals("Chassis no只能包含字母和数字", result.getMsg());
        verifyNoInteractions(hdocModificationsMapper);
    }

    // ============================================================
    // saveModifications() — 数据库查询分支
    // ============================================================

    @Test
    @DisplayName("查询 - Mapper返回null，应返回200且modificationList为空列表")
    void saveModifications_MapperReturnsNull_ShouldReturnSuccessWithEmptyList() {
        UD06SaveModificationsRequest request = UD06SaveModificationsRequest.builder()
                .chassisSerie("ABCD")
                .chassisNo("123456")
                .build();
        when(hdocModificationsMapper.selectLatestModification("ABCD", "123456")).thenReturn(null);

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(request);

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertNotNull(result.getData().getModificationList());
        assertTrue(result.getData().getModificationList().isEmpty());
        verify(hdocModificationsMapper, times(1)).selectLatestModification("ABCD", "123456");
    }

    @Test
    @DisplayName("查询 - Mapper返回空列表，应返回200且modificationList为空列表")
    void saveModifications_MapperReturnsEmpty_ShouldReturnSuccessWithEmptyList() {
        UD06SaveModificationsRequest request = UD06SaveModificationsRequest.builder()
                .chassisSerie("ABCD")
                .chassisNo("123456")
                .build();
        when(hdocModificationsMapper.selectLatestModification("ABCD", "123456")).thenReturn(Collections.emptyList());

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(request);

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertTrue(result.getData().getModificationList().isEmpty());
        verify(hdocModificationsMapper, times(1)).selectLatestModification("ABCD", "123456");
    }

    @Test
    @DisplayName("查询 - Mapper返回非空列表，应返回200包含数据")
    void saveModifications_MapperReturnsData_ShouldReturnSuccess() {
        UD06SaveModificationsRequest request = UD06SaveModificationsRequest.builder()
                .chassisSerie("ABCD")
                .chassisNo("123456")
                .build();

        UD06SaveModificationsResponse.ModificationItem item =
                UD06SaveModificationsResponse.ModificationItem.builder()
                        .DOCTYPE("HDOC")
                        .VERS("1.0")
                        .VARIABLE("VAR001")
                        .NEWVAL("NEW_VALUE")
                        .UPDATE_DATETIME("2026-07-20 10:00:00")
                        .build();
        List<UD06SaveModificationsResponse.ModificationItem> mockList = Arrays.asList(item);
        when(hdocModificationsMapper.selectLatestModification("ABCD", "123456")).thenReturn(mockList);

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(request);

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertEquals(1, result.getData().getModificationList().size());
        assertEquals("HDOC", result.getData().getModificationList().get(0).getDOCTYPE());
        assertEquals("VAR001", result.getData().getModificationList().get(0).getVARIABLE());
        verify(hdocModificationsMapper, times(1)).selectLatestModification("ABCD", "123456");
    }

    @Test
    @DisplayName("查询 - Mapper抛出异常，应返回500")
    void saveModifications_MapperThrowsException_ShouldReturn500() {
        UD06SaveModificationsRequest request = UD06SaveModificationsRequest.builder()
                .chassisSerie("ABCD")
                .chassisNo("123456")
                .build();
        when(hdocModificationsMapper.selectLatestModification("ABCD", "123456"))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(request);

        assertEquals(500, result.getCode());
        assertEquals("System error. Please contact administrator.", result.getMsg());
        verify(hdocModificationsMapper, times(1)).selectLatestModification("ABCD", "123456");
    }
}
