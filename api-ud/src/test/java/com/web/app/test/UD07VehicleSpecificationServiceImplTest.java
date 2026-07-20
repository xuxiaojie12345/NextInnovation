package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD07VehicleSpecificationRequest;
import com.web.app.domain.UD07VehicleSpecificationResponse;
import com.web.app.mapper.HdocRecDataKolaVariantMapper;
import com.web.app.mapper.HdocRecDataOmMapper;
import com.web.app.service.impl.UD07VehicleSpecificationServiceImpl;
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
 * 覆盖所有分支路径，达到100%分支覆盖率
 */
@ExtendWith(MockitoExtension.class)
class UD07VehicleSpecificationServiceImplTest {

    @Mock
    private HdocRecDataOmMapper hdocRecDataOmMapper;

    @Mock
    private HdocRecDataKolaVariantMapper hdocRecDataKolaVariantMapper;

    @InjectMocks
    private UD07VehicleSpecificationServiceImpl service;

    private UD07VehicleSpecificationRequest buildRequest(String chassisNo) {
        UD07VehicleSpecificationRequest request = new UD07VehicleSpecificationRequest();
        request.setChassisNo(chassisNo);
        return request;
    }

    private Map<String, Object> buildBaseInfo(String familyId, String variantId) {
        Map<String, Object> map = new HashMap<>();
        map.put("model", "ModelX");
        map.put("builtWeek", "202630");
        map.put("customerAdap", "S-NOTE-001");
        map.put("productType", "CAR");
        map.put("vin", "WBA1234567890");
        map.put("countryOfOperation", "JP");
        map.put("familyId", familyId);
        map.put("variantId", variantId);
        return map;
    }

    // ============================================================
    // validateRequest — 参数校验分支
    // ============================================================

    @Test
    @DisplayName("参数校验 - chassisNo为null，应返回400")
    void getVehicleSpecification_ChassisNoNull_ShouldReturn400() {
        ApiResponse<UD07VehicleSpecificationResponse> result =
                service.getVehicleSpecification(buildRequest(null));

        assertEquals(400, result.getCode());
        assertEquals("Chassis no不能为空", result.getMsg());
        verifyNoInteractions(hdocRecDataOmMapper, hdocRecDataKolaVariantMapper);
    }

    @Test
    @DisplayName("参数校验 - chassisNo为空字符串，应返回400")
    void getVehicleSpecification_ChassisNoEmpty_ShouldReturn400() {
        ApiResponse<UD07VehicleSpecificationResponse> result =
                service.getVehicleSpecification(buildRequest(""));

        assertEquals(400, result.getCode());
        assertEquals("Chassis no不能为空", result.getMsg());
        verifyNoInteractions(hdocRecDataOmMapper, hdocRecDataKolaVariantMapper);
    }

    @Test
    @DisplayName("参数校验 - chassisNo为空白字符串，应返回400")
    void getVehicleSpecification_ChassisNoBlank_ShouldReturn400() {
        ApiResponse<UD07VehicleSpecificationResponse> result =
                service.getVehicleSpecification(buildRequest("   "));

        assertEquals(400, result.getCode());
        assertEquals("Chassis no不能为空", result.getMsg());
        verifyNoInteractions(hdocRecDataOmMapper, hdocRecDataKolaVariantMapper);
    }

    @Test
    @DisplayName("参数校验 - chassisNo长度小于4，应返回400")
    void getVehicleSpecification_ChassisNoLengthLessThan4_ShouldReturn400() {
        ApiResponse<UD07VehicleSpecificationResponse> result =
                service.getVehicleSpecification(buildRequest("ABC"));

        assertEquals(400, result.getCode());
        assertEquals("Chassis no长度不足,至少需要4位", result.getMsg());
        verifyNoInteractions(hdocRecDataOmMapper, hdocRecDataKolaVariantMapper);
    }

    @Test
    @DisplayName("参数校验 - chassisNo前4位不是字母，应返回400")
    void getVehicleSpecification_ChassisNoFirst4NotLetters_ShouldReturn400() {
        ApiResponse<UD07VehicleSpecificationResponse> result =
                service.getVehicleSpecification(buildRequest("1234ABC"));

        assertEquals(400, result.getCode());
        assertEquals("Chassis no前4位必须为字母", result.getMsg());
        verifyNoInteractions(hdocRecDataOmMapper, hdocRecDataKolaVariantMapper);
    }

    // ============================================================
    // getVehicleSpecification — 车辆基础信息查询分支
    // ============================================================

    @Test
    @DisplayName("查询 - 车辆基础信息为null，应返回404")
    void getVehicleSpecification_BaseInfoNull_ShouldReturn404() {
        UD07VehicleSpecificationRequest request = buildRequest("ABCD123");
        when(hdocRecDataOmMapper.selectVehicleBaseInfo("ABCD", "123")).thenReturn(null);

        ApiResponse<UD07VehicleSpecificationResponse> result =
                service.getVehicleSpecification(request);

        assertEquals(404, result.getCode());
        assertEquals("未找到对应的车辆信息", result.getMsg());
        verify(hdocRecDataOmMapper, times(1)).selectVehicleBaseInfo("ABCD", "123");
        verifyNoInteractions(hdocRecDataKolaVariantMapper);
    }

    @Test
    @DisplayName("查询 - 车辆基础信息为空Map，应返回404")
    void getVehicleSpecification_BaseInfoEmpty_ShouldReturn404() {
        UD07VehicleSpecificationRequest request = buildRequest("ABCD123");
        when(hdocRecDataOmMapper.selectVehicleBaseInfo("ABCD", "123")).thenReturn(new HashMap<>());

        ApiResponse<UD07VehicleSpecificationResponse> result =
                service.getVehicleSpecification(request);

        assertEquals(404, result.getCode());
        assertEquals("未找到对应的车辆信息", result.getMsg());
        verify(hdocRecDataOmMapper, times(1)).selectVehicleBaseInfo("ABCD", "123");
        verifyNoInteractions(hdocRecDataKolaVariantMapper);
    }

    // ============================================================
    // getVehicleSpecification — familyId/variantId为空判断分支
    // ============================================================

    @Test
    @DisplayName("查询 - familyId为null，跳過变体查询，engineNo为N/A")
    void getVehicleSpecification_FamilyIdNull_ShouldSkipVariantQuery() {
        UD07VehicleSpecificationRequest request = buildRequest("ABCD123");
        Map<String, Object> baseInfo = buildBaseInfo(null, "VAR001");
        when(hdocRecDataOmMapper.selectVehicleBaseInfo("ABCD", "123")).thenReturn(baseInfo);

        ApiResponse<UD07VehicleSpecificationResponse> result =
                service.getVehicleSpecification(request);

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertNotNull(result.getData().getVariantInfo());
        assertTrue(result.getData().getVariantInfo().getList().isEmpty());
        assertEquals("N/A", result.getData().getEngineNo());
        verify(hdocRecDataOmMapper, times(1)).selectVehicleBaseInfo("ABCD", "123");
        verifyNoInteractions(hdocRecDataKolaVariantMapper);
    }

    @Test
    @DisplayName("查询 - familyId为空字符串，跳过变体查询，engineNo为N/A")
    void getVehicleSpecification_FamilyIdEmpty_ShouldSkipVariantQuery() {
        UD07VehicleSpecificationRequest request = buildRequest("ABCD123");
        Map<String, Object> baseInfo = buildBaseInfo("", "VAR001");
        when(hdocRecDataOmMapper.selectVehicleBaseInfo("ABCD", "123")).thenReturn(baseInfo);

        ApiResponse<UD07VehicleSpecificationResponse> result =
                service.getVehicleSpecification(request);

        assertEquals(200, result.getCode());
        assertTrue(result.getData().getVariantInfo().getList().isEmpty());
        assertEquals("N/A", result.getData().getEngineNo());
        verifyNoInteractions(hdocRecDataKolaVariantMapper);
    }

    @Test
    @DisplayName("查询 - variantId为null，跳过变体查询，engineNo为N/A")
    void getVehicleSpecification_VariantIdNull_ShouldSkipVariantQuery() {
        UD07VehicleSpecificationRequest request = buildRequest("ABCD123");
        Map<String, Object> baseInfo = buildBaseInfo("FAM001", null);
        when(hdocRecDataOmMapper.selectVehicleBaseInfo("ABCD", "123")).thenReturn(baseInfo);

        ApiResponse<UD07VehicleSpecificationResponse> result =
                service.getVehicleSpecification(request);

        assertEquals(200, result.getCode());
        assertTrue(result.getData().getVariantInfo().getList().isEmpty());
        assertEquals("N/A", result.getData().getEngineNo());
        verifyNoInteractions(hdocRecDataKolaVariantMapper);
    }

    @Test
    @DisplayName("查询 - variantId为空字符串，跳过变体查询，engineNo为N/A")
    void getVehicleSpecification_VariantIdEmpty_ShouldSkipVariantQuery() {
        UD07VehicleSpecificationRequest request = buildRequest("ABCD123");
        Map<String, Object> baseInfo = buildBaseInfo("FAM001", "");
        when(hdocRecDataOmMapper.selectVehicleBaseInfo("ABCD", "123")).thenReturn(baseInfo);

        ApiResponse<UD07VehicleSpecificationResponse> result =
                service.getVehicleSpecification(request);

        assertEquals(200, result.getCode());
        assertTrue(result.getData().getVariantInfo().getList().isEmpty());
        assertEquals("N/A", result.getData().getEngineNo());
        verifyNoInteractions(hdocRecDataKolaVariantMapper);
    }

    // ============================================================
    // getVehicleSpecification — 变体查询结果分支
    // ============================================================

    @Test
    @DisplayName("查询 - 变体列表为null，应返回空列表，engineNo为N/A")
    void getVehicleSpecification_VariantListNull_ShouldReturnEmptyList() {
        UD07VehicleSpecificationRequest request = buildRequest("ABCD123");
        Map<String, Object> baseInfo = buildBaseInfo("FAM001", "VAR001");
        when(hdocRecDataOmMapper.selectVehicleBaseInfo("ABCD", "123")).thenReturn(baseInfo);
        when(hdocRecDataKolaVariantMapper.selectVariantList("FAM001", "VAR001")).thenReturn(null);

        ApiResponse<UD07VehicleSpecificationResponse> result =
                service.getVehicleSpecification(request);

        assertEquals(200, result.getCode());
        assertNotNull(result.getData().getVariantInfo().getList());
        assertTrue(result.getData().getVariantInfo().getList().isEmpty());
        assertEquals("N/A", result.getData().getEngineNo());
        verify(hdocRecDataKolaVariantMapper, times(1)).selectVariantList("FAM001", "VAR001");
    }

    @Test
    @DisplayName("查询 - 变体列表为空，应返回空列表，engineNo为N/A")
    void getVehicleSpecification_VariantListEmpty_ShouldReturnEmptyList() {
        UD07VehicleSpecificationRequest request = buildRequest("ABCD123");
        Map<String, Object> baseInfo = buildBaseInfo("FAM001", "VAR001");
        when(hdocRecDataOmMapper.selectVehicleBaseInfo("ABCD", "123")).thenReturn(baseInfo);
        when(hdocRecDataKolaVariantMapper.selectVariantList("FAM001", "VAR001")).thenReturn(new ArrayList<>());

        ApiResponse<UD07VehicleSpecificationResponse> result =
                service.getVehicleSpecification(request);

        assertEquals(200, result.getCode());
        assertTrue(result.getData().getVariantInfo().getList().isEmpty());
        assertEquals("N/A", result.getData().getEngineNo());
        verify(hdocRecDataKolaVariantMapper, times(1)).selectVariantList("FAM001", "VAR001");
    }

    @Test
    @DisplayName("查询 - 变体列表非空且symbolPrefix有值，engineNo取symbolPrefix值")
    void getVehicleSpecification_VariantListNotEmptyAndSymbolPrefixPresent_ShouldUseEngineNo() {
        UD07VehicleSpecificationRequest request = buildRequest("ABCD123");
        Map<String, Object> baseInfo = buildBaseInfo("FAM001", "VAR001");
        when(hdocRecDataOmMapper.selectVehicleBaseInfo("ABCD", "123")).thenReturn(baseInfo);

        Map<String, Object> variant = new HashMap<>();
        variant.put("symbolPrefix", "ENG-123");
        variant.put("description", "Engine variant");
        variant.put("functionGroup", "FG01");
        List<Map<String, Object>> variantList = Collections.singletonList(variant);
        when(hdocRecDataKolaVariantMapper.selectVariantList("FAM001", "VAR001")).thenReturn(variantList);

        ApiResponse<UD07VehicleSpecificationResponse> result =
                service.getVehicleSpecification(request);

        assertEquals(200, result.getCode());
        assertEquals(1, result.getData().getVariantInfo().getList().size());
        assertEquals("ENG-123", result.getData().getVariantInfo().getList().get(0).getSymbol());
        assertEquals("Engine variant", result.getData().getVariantInfo().getList().get(0).getDescription());
        assertEquals("FG01", result.getData().getVariantInfo().getList().get(0).getFunctionGroup());
        assertEquals("ENG-123", result.getData().getEngineNo());
        verify(hdocRecDataKolaVariantMapper, times(1)).selectVariantList("FAM001", "VAR001");
    }

    @Test
    @DisplayName("查询 - 变体列表非空但symbolPrefix为null，engineNo为N/A")
    void getVehicleSpecification_SymbolPrefixNull_ShouldReturnEngineNoNA() {
        UD07VehicleSpecificationRequest request = buildRequest("ABCD123");
        Map<String, Object> baseInfo = buildBaseInfo("FAM001", "VAR001");
        when(hdocRecDataOmMapper.selectVehicleBaseInfo("ABCD", "123")).thenReturn(baseInfo);

        Map<String, Object> variant = new HashMap<>();
        variant.put("symbolPrefix", null);
        variant.put("description", "Desc");
        variant.put("functionGroup", "FG01");
        when(hdocRecDataKolaVariantMapper.selectVariantList("FAM001", "VAR001"))
                .thenReturn(Collections.singletonList(variant));

        ApiResponse<UD07VehicleSpecificationResponse> result =
                service.getVehicleSpecification(request);

        assertEquals(200, result.getCode());
        assertEquals(1, result.getData().getVariantInfo().getList().size());
        assertEquals("N/A", result.getData().getEngineNo());
    }

    @Test
    @DisplayName("查询 - 变体列表非空但symbolPrefix为空字符串，engineNo为N/A")
    void getVehicleSpecification_SymbolPrefixEmpty_ShouldReturnEngineNoNA() {
        UD07VehicleSpecificationRequest request = buildRequest("ABCD123");
        Map<String, Object> baseInfo = buildBaseInfo("FAM001", "VAR001");
        when(hdocRecDataOmMapper.selectVehicleBaseInfo("ABCD", "123")).thenReturn(baseInfo);

        Map<String, Object> variant = new HashMap<>();
        variant.put("symbolPrefix", "");
        variant.put("description", "Desc");
        variant.put("functionGroup", "FG01");
        when(hdocRecDataKolaVariantMapper.selectVariantList("FAM001", "VAR001"))
                .thenReturn(Collections.singletonList(variant));

        ApiResponse<UD07VehicleSpecificationResponse> result =
                service.getVehicleSpecification(request);

        assertEquals(200, result.getCode());
        assertEquals("N/A", result.getData().getEngineNo());
    }

    @Test
    @DisplayName("查询 - 变体列表非空但symbolPrefix为空白，engineNo为N/A")
    void getVehicleSpecification_SymbolPrefixBlank_ShouldReturnEngineNoNA() {
        UD07VehicleSpecificationRequest request = buildRequest("ABCD123");
        Map<String, Object> baseInfo = buildBaseInfo("FAM001", "VAR001");
        when(hdocRecDataOmMapper.selectVehicleBaseInfo("ABCD", "123")).thenReturn(baseInfo);

        Map<String, Object> variant = new HashMap<>();
        variant.put("symbolPrefix", "   ");
        variant.put("description", "Desc");
        when(hdocRecDataKolaVariantMapper.selectVariantList("FAM001", "VAR001"))
                .thenReturn(Collections.singletonList(variant));

        ApiResponse<UD07VehicleSpecificationResponse> result =
                service.getVehicleSpecification(request);

        assertEquals(200, result.getCode());
        assertEquals("N/A", result.getData().getEngineNo());
    }

    @Test
    @DisplayName("查询 - chassisNo带空格（如JPCT 013945），应正确拆分serie和chnr")
    void getVehicleSpecification_ChassisNoWithSpaces_ShouldTrimCorrectly() {
        // "JPCT 013945" → trim → "JPCT 013945", serie="JPCT", chnr=" 013945".trim()="013945"
        UD07VehicleSpecificationRequest request = buildRequest("JPCT 013945");
        Map<String, Object> baseInfo = buildBaseInfo("FAM001", "VAR001");
        when(hdocRecDataOmMapper.selectVehicleBaseInfo("JPCT", "013945")).thenReturn(baseInfo);

        Map<String, Object> variant = new HashMap<>();
        variant.put("symbolPrefix", "ENG456");
        variant.put("description", "Engine");
        when(hdocRecDataKolaVariantMapper.selectVariantList("FAM001", "VAR001"))
                .thenReturn(Collections.singletonList(variant));

        ApiResponse<UD07VehicleSpecificationResponse> result =
                service.getVehicleSpecification(request);

        assertEquals(200, result.getCode());
        assertNotNull(result.getData().getVehicleInfo());
        assertEquals("ModelX", result.getData().getVehicleInfo().getModel());
        assertEquals("FAM001", result.getData().getVehicleInfo().getFamilyId());
        assertEquals("VAR001", result.getData().getVehicleInfo().getVariantId());
        assertEquals("ENG456", result.getData().getEngineNo());
        verify(hdocRecDataOmMapper, times(1)).selectVehicleBaseInfo("JPCT", "013945");
    }

    @Test
    @DisplayName("查询 - Mapper抛出异常，应返回500")
    void getVehicleSpecification_MapperThrowsException_ShouldReturn500() {
        UD07VehicleSpecificationRequest request = buildRequest("ABCD123");
        when(hdocRecDataOmMapper.selectVehicleBaseInfo("ABCD", "123"))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<UD07VehicleSpecificationResponse> result =
                service.getVehicleSpecification(request);

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
        verify(hdocRecDataOmMapper, times(1)).selectVehicleBaseInfo("ABCD", "123");
    }
}
