package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD06SaveModificationsRequest;
import com.web.app.domain.UD06SaveModificationsResponse;
import com.web.app.mapper.HdocModificationsMapper;
import com.web.app.service.impl.UD06SaveModificationsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD06SaveModificationsServiceImpl 单元测试
 *
 * 覆盖所有分支（100%覆盖率）
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD06SaveModificationsServiceImpl 单元测试")
class UD06SaveModificationsServiceImplTest {

    @Mock
    private HdocModificationsMapper hdocModificationsMapper;

    @InjectMocks
    private UD06SaveModificationsServiceImpl service;

    private static final String VALID_SERIE = "JPCT";
    private static final String VALID_CHNO = "013945";

    private UD06SaveModificationsResponse.ModificationItem mockItem;

    @BeforeEach
    void setUp() {
        reset(hdocModificationsMapper);

        mockItem = UD06SaveModificationsResponse.ModificationItem.builder()
                .DOCTYPE("VIN_PLATE")
                .VERS("1.0")
                .VARIABLE("AXLE_CONF3")
                .NEWVAL("555")
                .UPDATE_DATETIME("2026-07-01 10:00:00")
                .build();
    }

    // ============================================================
    // validateRequest 分支测试
    // ============================================================

    @Test
    @DisplayName("validateRequest-ChassisSerie为null-返回400")
    void testValidate_ChassisSerieNull() {
        UD06SaveModificationsRequest req = UD06SaveModificationsRequest.builder()
                .chassisSerie(null)
                .chassisNo(VALID_CHNO)
                .build();

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(req);
        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis serie不能为空", result.getMsg());
        verifyNoInteractions(hdocModificationsMapper);
    }

    @Test
    @DisplayName("validateRequest-ChassisSerie为空字符串-返回400")
    void testValidate_ChassisSerieEmpty() {
        UD06SaveModificationsRequest req = UD06SaveModificationsRequest.builder()
                .chassisSerie("")
                .chassisNo(VALID_CHNO)
                .build();

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(req);
        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis serie不能为空", result.getMsg());
        verifyNoInteractions(hdocModificationsMapper);
    }

    @Test
    @DisplayName("validateRequest-ChassisSerie长度不为4-返回400")
    void testValidate_ChassisSerieLengthNot4() {
        UD06SaveModificationsRequest req = UD06SaveModificationsRequest.builder()
                .chassisSerie("JPC")
                .chassisNo(VALID_CHNO)
                .build();

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(req);
        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis serie长度必须为4位", result.getMsg());
        verifyNoInteractions(hdocModificationsMapper);
    }

    @Test
    @DisplayName("validateRequest-ChassisNo为null-返回400")
    void testValidate_ChassisNoNull() {
        UD06SaveModificationsRequest req = UD06SaveModificationsRequest.builder()
                .chassisSerie(VALID_SERIE)
                .chassisNo(null)
                .build();

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(req);
        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis no不能为空", result.getMsg());
        verifyNoInteractions(hdocModificationsMapper);
    }

    @Test
    @DisplayName("validateRequest-ChassisNo为空字符串-返回400")
    void testValidate_ChassisNoEmpty() {
        UD06SaveModificationsRequest req = UD06SaveModificationsRequest.builder()
                .chassisSerie(VALID_SERIE)
                .chassisNo("")
                .build();

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(req);
        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis no不能为空", result.getMsg());
        verifyNoInteractions(hdocModificationsMapper);
    }

    @Test
    @DisplayName("validateRequest-ChassisNo含非法字符-返回400")
    void testValidate_ChassisNoInvalidChars() {
        UD06SaveModificationsRequest req = UD06SaveModificationsRequest.builder()
                .chassisSerie(VALID_SERIE)
                .chassisNo("0139_5")
                .build();

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(req);
        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis no只能包含字母和数字", result.getMsg());
        verifyNoInteractions(hdocModificationsMapper);
    }

    // ============================================================
    // saveModifications 查询分支测试
    // ============================================================

    @Test
    @DisplayName("saveModifications-Mapper返回null-返回200空列表")
    void testSaveModifications_ListNull() {
        UD06SaveModificationsRequest req = UD06SaveModificationsRequest.builder()
                .chassisSerie(VALID_SERIE)
                .chassisNo(VALID_CHNO)
                .build();

        when(hdocModificationsMapper.selectLatestModification(VALID_SERIE, VALID_CHNO))
                .thenReturn(null);

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(req);

        assertEquals(200, result.getCode().intValue());
        assertNotNull(result.getData());
        assertNotNull(result.getData().getModificationList());
        assertTrue(result.getData().getModificationList().isEmpty());

        verify(hdocModificationsMapper, times(1))
                .selectLatestModification(VALID_SERIE, VALID_CHNO);
    }

    @Test
    @DisplayName("saveModifications-Mapper返回空列表-返回200空列表")
    void testSaveModifications_ListEmpty() {
        UD06SaveModificationsRequest req = UD06SaveModificationsRequest.builder()
                .chassisSerie(VALID_SERIE)
                .chassisNo(VALID_CHNO)
                .build();

        when(hdocModificationsMapper.selectLatestModification(VALID_SERIE, VALID_CHNO))
                .thenReturn(new ArrayList<>());

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(req);

        assertEquals(200, result.getCode().intValue());
        assertNotNull(result.getData());
        assertNotNull(result.getData().getModificationList());
        assertTrue(result.getData().getModificationList().isEmpty());

        verify(hdocModificationsMapper, times(1))
                .selectLatestModification(VALID_SERIE, VALID_CHNO);
    }

    @Test
    @DisplayName("saveModifications-查询成功-返回200含数据")
    void testSaveModifications_Success() {
        UD06SaveModificationsRequest req = UD06SaveModificationsRequest.builder()
                .chassisSerie(VALID_SERIE)
                .chassisNo(VALID_CHNO)
                .build();

        List<UD06SaveModificationsResponse.ModificationItem> list = Collections.singletonList(mockItem);
        when(hdocModificationsMapper.selectLatestModification(VALID_SERIE, VALID_CHNO))
                .thenReturn(list);

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(req);

        assertEquals(200, result.getCode().intValue());
        assertNotNull(result.getData());
        assertEquals(1, result.getData().getModificationList().size());
        assertEquals("VIN_PLATE", result.getData().getModificationList().get(0).getDOCTYPE());

        verify(hdocModificationsMapper, times(1))
                .selectLatestModification(VALID_SERIE, VALID_CHNO);
    }

    @Test
    @DisplayName("saveModifications-Mapper抛出异常-返回500")
    void testSaveModifications_Exception() {
        UD06SaveModificationsRequest req = UD06SaveModificationsRequest.builder()
                .chassisSerie(VALID_SERIE)
                .chassisNo(VALID_CHNO)
                .build();

        when(hdocModificationsMapper.selectLatestModification(VALID_SERIE, VALID_CHNO))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<UD06SaveModificationsResponse> result = service.saveModifications(req);

        assertEquals(500, result.getCode().intValue());
        assertEquals("System error. Please contact administrator.", result.getMsg());

        verify(hdocModificationsMapper, times(1))
                .selectLatestModification(VALID_SERIE, VALID_CHNO);
    }
}
