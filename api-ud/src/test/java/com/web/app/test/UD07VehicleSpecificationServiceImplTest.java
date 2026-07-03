package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD07VehicleSpecificationRequest;
import com.web.app.domain.UD07VehicleSpecificationResponse;
import com.web.app.mapper.HdocRecDataKolaVariantMapper;
import com.web.app.mapper.HdocRecDataOmMapper;
import com.web.app.service.impl.UD07VehicleSpecificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
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
 * UD07VehicleSpecificationServiceImpl 单元测试
 *
 * 覆盖所有分支（100%覆盖率）
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD07VehicleSpecificationServiceImpl 单元测试")
class UD07VehicleSpecificationServiceImplTest {

    @Mock
    private HdocRecDataOmMapper hdocRecDataOmMapper;

    @Mock
    private HdocRecDataKolaVariantMapper hdocRecDataKolaVariantMapper;

    @InjectMocks
    private UD07VehicleSpecificationServiceImpl service;

    private static final String FULL_CHASSIS = "JPCT013945";
    private static final String SERIE = "JPCT";
    private static final String CHNR = "013945";

    private Map<String, Object> mockVehicleBaseInfo;

    @BeforeEach
    void setUp() {
        reset(hdocRecDataOmMapper, hdocRecDataKolaVariantMapper);

        mockVehicleBaseInfo = new HashMap<>();
        mockVehicleBaseInfo.put("model", "IDO");
        mockVehicleBaseInfo.put("builtWeek", "2016173");
        mockVehicleBaseInfo.put("vin", "xxxxxxxxxxxxxxxxx");
        mockVehicleBaseInfo.put("productType", "TRUCK");
        mockVehicleBaseInfo.put("countryOfOperation", "IDO");
        mockVehicleBaseInfo.put("customerAdap", "S1810111");
        mockVehicleBaseInfo.put("familyId", "DPX123");
        mockVehicleBaseInfo.put("variantId", "VAR001");
    }

    // ============================================================
    // validateRequest 分支测试
    // ============================================================

    @Test
    @DisplayName("validateRequest-ChassisNo为null-返回400")
    void testValidate_ChassisNoNull() {
        UD07VehicleSpecificationRequest req = new UD07VehicleSpecificationRequest();
        req.setChassisNo(null);

        ApiResponse<UD07VehicleSpecificationResponse> result = service.getVehicleSpecification(req);
        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis no不能为空", result.getMsg());
        verifyNoInteractions(hdocRecDataOmMapper, hdocRecDataKolaVariantMapper);
    }

    @Test
    @DisplayName("validateRequest-ChassisNo为空字符串-返回400")
    void testValidate_ChassisNoEmpty() {
        UD07VehicleSpecificationRequest req = new UD07VehicleSpecificationRequest();
        req.setChassisNo("");

        ApiResponse<UD07VehicleSpecificationResponse> result = service.getVehicleSpecification(req);
        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis no不能为空", result.getMsg());
        verifyNoInteractions(hdocRecDataOmMapper, hdocRecDataKolaVariantMapper);
    }

    @Test
    @DisplayName("validateRequest-ChassisNo长度不足4位-返回400")
    void testValidate_ChassisNoTooShort() {
        UD07VehicleSpecificationRequest req = new UD07VehicleSpecificationRequest();
        req.setChassisNo("ABC");

        ApiResponse<UD07VehicleSpecificationResponse> result = service.getVehicleSpecification(req);
        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis no长度不足，至少需要4位", result.getMsg());
        verifyNoInteractions(hdocRecDataOmMapper, hdocRecDataKolaVariantMapper);
    }

    @Test
    @DisplayName("validateRequest-ChassisNo前4位非字母-返回400")
    void testValidate_ChassisNoSerieNotAlpha() {
        UD07VehicleSpecificationRequest req = new UD07VehicleSpecificationRequest();
        req.setChassisNo("1234ABCD");

        ApiResponse<UD07VehicleSpecificationResponse> result = service.getVehicleSpecification(req);
        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis no前4位必须为字母", result.getMsg());
        verifyNoInteractions(hdocRecDataOmMapper, hdocRecDataKolaVariantMapper);
    }

    // ============================================================
    // getVehicleSpecification - 车辆信息查询分支测试
    // ============================================================

    @Test
    @DisplayName("车辆基础信息为null-返回404")
    void testGetVehicleSpecification_BaseInfoNull() {
        UD07VehicleSpecificationRequest req = new UD07VehicleSpecificationRequest();
        req.setChassisNo(FULL_CHASSIS);

        when(hdocRecDataOmMapper.selectVehicleBaseInfo(SERIE, CHNR)).thenReturn(null);

        ApiResponse<UD07VehicleSpecificationResponse> result = service.getVehicleSpecification(req);
        assertEquals(404, result.getCode().intValue());
        assertEquals("未找到对应的车辆信息", result.getMsg());

        verify(hdocRecDataOmMapper, times(1)).selectVehicleBaseInfo(SERIE, CHNR);
        verifyNoInteractions(hdocRecDataKolaVariantMapper);
    }

    @Test
    @DisplayName("车辆基础信息为空Map-返回404")
    void testGetVehicleSpecification_BaseInfoEmpty() {
        UD07VehicleSpecificationRequest req = new UD07VehicleSpecificationRequest();
        req.setChassisNo(FULL_CHASSIS);

        when(hdocRecDataOmMapper.selectVehicleBaseInfo(SERIE, CHNR)).thenReturn(new HashMap<>());

        ApiResponse<UD07VehicleSpecificationResponse> result = service.getVehicleSpecification(req);
        assertEquals(404, result.getCode().intValue());
        assertEquals("未找到对应的车辆信息", result.getMsg());

        verify(hdocRecDataOmMapper, times(1)).selectVehicleBaseInfo(SERIE, CHNR);
        verifyNoInteractions(hdocRecDataKolaVariantMapper);
    }

    @Test
    @DisplayName("familyId为空-跳过变体查询-engineNo默认N/A")
    void testGetVehicleSpecification_FamilyIdEmpty() {
        UD07VehicleSpecificationRequest req = new UD07VehicleSpecificationRequest();
        req.setChassisNo(FULL_CHASSIS);

        Map<String, Object> baseInfo = new HashMap<>(mockVehicleBaseInfo);
        baseInfo.put("familyId", "");
        baseInfo.put("variantId", "VAR001");

        when(hdocRecDataOmMapper.selectVehicleBaseInfo(SERIE, CHNR)).thenReturn(baseInfo);

        ApiResponse<UD07VehicleSpecificationResponse> result = service.getVehicleSpecification(req);

        assertEquals(200, result.getCode().intValue());
        assertNotNull(result.getData());
        assertEquals("N/A", result.getData().getEngineNo());
        assertTrue(result.getData().getVariantInfo().getList().isEmpty());

        verify(hdocRecDataOmMapper, times(1)).selectVehicleBaseInfo(SERIE, CHNR);
        verifyNoInteractions(hdocRecDataKolaVariantMapper);
    }

    @Test
    @DisplayName("variantId为null-跳过变体查询-engineNo默认N/A")
    void testGetVehicleSpecification_VariantIdNull() {
        UD07VehicleSpecificationRequest req = new UD07VehicleSpecificationRequest();
        req.setChassisNo(FULL_CHASSIS);

        Map<String, Object> baseInfo = new HashMap<>(mockVehicleBaseInfo);
        baseInfo.put("variantId", null);

        when(hdocRecDataOmMapper.selectVehicleBaseInfo(SERIE, CHNR)).thenReturn(baseInfo);

        ApiResponse<UD07VehicleSpecificationResponse> result = service.getVehicleSpecification(req);

        assertEquals(200, result.getCode().intValue());
        assertEquals("N/A", result.getData().getEngineNo());
        assertTrue(result.getData().getVariantInfo().getList().isEmpty());

        verify(hdocRecDataOmMapper, times(1)).selectVehicleBaseInfo(SERIE, CHNR);
        verifyNoInteractions(hdocRecDataKolaVariantMapper);
    }

    @Test
    @DisplayName("变体查询返回null-变体列表为空-engineNo默认N/A")
    void testGetVehicleSpecification_VariantListNull() {
        UD07VehicleSpecificationRequest req = new UD07VehicleSpecificationRequest();
        req.setChassisNo(FULL_CHASSIS);

        when(hdocRecDataOmMapper.selectVehicleBaseInfo(SERIE, CHNR)).thenReturn(mockVehicleBaseInfo);
        when(hdocRecDataKolaVariantMapper.selectVariantList("DPX123", "VAR001")).thenReturn(null);

        ApiResponse<UD07VehicleSpecificationResponse> result = service.getVehicleSpecification(req);

        assertEquals(200, result.getCode().intValue());
        assertEquals("N/A", result.getData().getEngineNo());
        assertTrue(result.getData().getVariantInfo().getList().isEmpty());

        verify(hdocRecDataOmMapper, times(1)).selectVehicleBaseInfo(SERIE, CHNR);
        verify(hdocRecDataKolaVariantMapper, times(1)).selectVariantList("DPX123", "VAR001");
    }

    @Test
    @DisplayName("变体查询返回空列表-变体列表为空-engineNo默认N/A")
    void testGetVehicleSpecification_VariantListEmpty() {
        UD07VehicleSpecificationRequest req = new UD07VehicleSpecificationRequest();
        req.setChassisNo(FULL_CHASSIS);

        when(hdocRecDataOmMapper.selectVehicleBaseInfo(SERIE, CHNR)).thenReturn(mockVehicleBaseInfo);
        when(hdocRecDataKolaVariantMapper.selectVariantList("DPX123", "VAR001")).thenReturn(new ArrayList<>());

        ApiResponse<UD07VehicleSpecificationResponse> result = service.getVehicleSpecification(req);

        assertEquals(200, result.getCode().intValue());
        assertEquals("N/A", result.getData().getEngineNo());
        assertTrue(result.getData().getVariantInfo().getList().isEmpty());

        verify(hdocRecDataOmMapper, times(1)).selectVehicleBaseInfo(SERIE, CHNR);
        verify(hdocRecDataKolaVariantMapper, times(1)).selectVariantList("DPX123", "VAR001");
    }

    @Test
    @DisplayName("变体查询成功-symbolPrefix有值-engineNo取值正确")
    void testGetVehicleSpecification_VariantSuccess() {
        UD07VehicleSpecificationRequest req = new UD07VehicleSpecificationRequest();
        req.setChassisNo(FULL_CHASSIS);

        Map<String, Object> variant = new HashMap<>();
        variant.put("symbolPrefix", "ENG123456");
        variant.put("description", "Engine Description");
        variant.put("functionGroup", "0001");

        when(hdocRecDataOmMapper.selectVehicleBaseInfo(SERIE, CHNR)).thenReturn(mockVehicleBaseInfo);
        when(hdocRecDataKolaVariantMapper.selectVariantList("DPX123", "VAR001"))
                .thenReturn(Collections.singletonList(variant));

        ApiResponse<UD07VehicleSpecificationResponse> result = service.getVehicleSpecification(req);

        assertEquals(200, result.getCode().intValue());
        assertEquals("ENG123456", result.getData().getEngineNo());
        assertEquals(1, result.getData().getVariantInfo().getList().size());
        assertEquals("ENG123456", result.getData().getVariantInfo().getList().get(0).getSymbol());

        verify(hdocRecDataOmMapper, times(1)).selectVehicleBaseInfo(SERIE, CHNR);
        verify(hdocRecDataKolaVariantMapper, times(1)).selectVariantList("DPX123", "VAR001");
    }

    @Test
    @DisplayName("变体查询成功-symbolPrefix为null-engineNo显示N/A")
    void testGetVehicleSpecification_SymbolPrefixNull() {
        UD07VehicleSpecificationRequest req = new UD07VehicleSpecificationRequest();
        req.setChassisNo(FULL_CHASSIS);

        Map<String, Object> variant = new HashMap<>();
        variant.put("symbolPrefix", null);
        variant.put("description", "Desc");
        variant.put("functionGroup", "0001");

        when(hdocRecDataOmMapper.selectVehicleBaseInfo(SERIE, CHNR)).thenReturn(mockVehicleBaseInfo);
        when(hdocRecDataKolaVariantMapper.selectVariantList("DPX123", "VAR001"))
                .thenReturn(Collections.singletonList(variant));

        ApiResponse<UD07VehicleSpecificationResponse> result = service.getVehicleSpecification(req);

        assertEquals(200, result.getCode().intValue());
        assertEquals("N/A", result.getData().getEngineNo());

        verify(hdocRecDataOmMapper, times(1)).selectVehicleBaseInfo(SERIE, CHNR);
        verify(hdocRecDataKolaVariantMapper, times(1)).selectVariantList("DPX123", "VAR001");
    }

    @Test
    @DisplayName("变体查询成功-symbolPrefix为空字符串-engineNo显示N/A")
    void testGetVehicleSpecification_SymbolPrefixEmpty() {
        UD07VehicleSpecificationRequest req = new UD07VehicleSpecificationRequest();
        req.setChassisNo(FULL_CHASSIS);

        Map<String, Object> variant = new HashMap<>();
        variant.put("symbolPrefix", "");
        variant.put("description", "Desc");
        variant.put("functionGroup", "0001");

        when(hdocRecDataOmMapper.selectVehicleBaseInfo(SERIE, CHNR)).thenReturn(mockVehicleBaseInfo);
        when(hdocRecDataKolaVariantMapper.selectVariantList("DPX123", "VAR001"))
                .thenReturn(Collections.singletonList(variant));

        ApiResponse<UD07VehicleSpecificationResponse> result = service.getVehicleSpecification(req);

        assertEquals(200, result.getCode().intValue());
        assertEquals("N/A", result.getData().getEngineNo());
    }

    @Test
    @DisplayName("Mapper抛出异常-返回500")
    void testGetVehicleSpecification_Exception() {
        UD07VehicleSpecificationRequest req = new UD07VehicleSpecificationRequest();
        req.setChassisNo(FULL_CHASSIS);

        when(hdocRecDataOmMapper.selectVehicleBaseInfo(SERIE, CHNR))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<UD07VehicleSpecificationResponse> result = service.getVehicleSpecification(req);

        assertEquals(500, result.getCode().intValue());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());

        verify(hdocRecDataOmMapper, times(1)).selectVehicleBaseInfo(SERIE, CHNR);
        verifyNoInteractions(hdocRecDataKolaVariantMapper);
    }

    @Test
    @DisplayName("完整成功路径-获取所有车辆信息")
    void testGetVehicleSpecification_FullSuccess() {
        UD07VehicleSpecificationRequest req = new UD07VehicleSpecificationRequest();
        req.setChassisNo(FULL_CHASSIS);

        Map<String, Object> variant = new HashMap<>();
        variant.put("symbolPrefix", "SYM12345");
        variant.put("description", "Test Desc");
        variant.put("functionGroup", "0001");

        when(hdocRecDataOmMapper.selectVehicleBaseInfo(SERIE, CHNR)).thenReturn(mockVehicleBaseInfo);
        when(hdocRecDataKolaVariantMapper.selectVariantList("DPX123", "VAR001"))
                .thenReturn(Collections.singletonList(variant));

        ApiResponse<UD07VehicleSpecificationResponse> result = service.getVehicleSpecification(req);

        assertEquals(200, result.getCode().intValue());
        assertNotNull(result.getData().getVehicleInfo());
        assertEquals("IDO", result.getData().getVehicleInfo().getModel());
        assertEquals("2016173", result.getData().getVehicleInfo().getBuiltWeek());
        assertEquals("TRUCK", result.getData().getVehicleInfo().getProductType());
        assertEquals("xxxxxxxxxxxxxxxxx", result.getData().getVehicleInfo().getVin());
        assertEquals("IDO", result.getData().getVehicleInfo().getCountryOfOperation());
        assertEquals("S1810111", result.getData().getVehicleInfo().getCustomerAdap());
        assertEquals("DPX123", result.getData().getVehicleInfo().getFamilyId());
        assertEquals("VAR001", result.getData().getVehicleInfo().getVariantId());
        assertEquals("SYM12345", result.getData().getEngineNo());
        assertEquals(1, result.getData().getVariantInfo().getList().size());
        assertEquals("SYM12345", result.getData().getVariantInfo().getList().get(0).getSymbol());
        assertEquals("Test Desc", result.getData().getVariantInfo().getList().get(0).getDescription());
        assertEquals("0001", result.getData().getVariantInfo().getList().get(0).getFunctionGroup());
    }
}
