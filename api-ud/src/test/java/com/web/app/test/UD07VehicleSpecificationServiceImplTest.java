package com.web.app.test;

import com.web.app.dto.UD07VehicleSpecificationRequest;
import com.web.app.dto.UD07VehicleSpecificationResponse;
import com.web.app.entity.UD07KolaVariantVO;
import com.web.app.entity.UD07VehicleSpecificationVO;
import com.web.app.mapper.UD07VehicleSpecificationMapper;
import com.web.app.service.impl.UD07VehicleSpecificationServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD07VehicleSpecificationServiceImpl 单元测试
 * 覆盖 validateRequest 所有分支及业务逻辑所有分支（含 null 处理、substring/format），达到 100% JaCoCo
 * 覆盖率
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD07VehicleSpecificationServiceImpl 单元测试")
class UD07VehicleSpecificationServiceImplTest {

    @Mock
    private UD07VehicleSpecificationMapper ud07Mapper;

    @InjectMocks
    private UD07VehicleSpecificationServiceImpl service;

    // ==================== 参数校验分支: request ====================

    @Test
    @DisplayName("request 为 null 时应返回400")
    void testValidate_RequestNull() {
        UD07VehicleSpecificationResponse response = service.getHdocRecDataVdaKolaGeneral(null);
        assertEquals(400, response.getCode());
        assertEquals("Request is required.", response.getMsg());
    }

    // ==================== 参数校验分支: serie ====================

    @Test
    @DisplayName("serie 为 null/空时应返回400")
    void testValidate_SerieEmpty() {
        UD07VehicleSpecificationRequest request = new UD07VehicleSpecificationRequest(null, "12345");
        UD07VehicleSpecificationResponse response = service.getHdocRecDataVdaKolaGeneral(request);
        assertEquals(400, response.getCode());
        assertEquals("Serie is required.", response.getMsg());

        request = new UD07VehicleSpecificationRequest("", "12345");
        response = service.getHdocRecDataVdaKolaGeneral(request);
        assertEquals(400, response.getCode());
        assertEquals("Serie is required.", response.getMsg());
    }

    @Test
    @DisplayName("serie 超过5字符时应返回400")
    void testValidate_SerieTooLong() {
        UD07VehicleSpecificationRequest request = new UD07VehicleSpecificationRequest("ABCDEF", "12345");
        UD07VehicleSpecificationResponse response = service.getHdocRecDataVdaKolaGeneral(request);
        assertEquals(400, response.getCode());
        assertEquals("Serie must be at most 5 characters.", response.getMsg());
    }

    @Test
    @DisplayName("serie 包含非英数字符时应返回400")
    void testValidate_SerieInvalidChars() {
        UD07VehicleSpecificationRequest request = new UD07VehicleSpecificationRequest("AB-12", "12345");
        UD07VehicleSpecificationResponse response = service.getHdocRecDataVdaKolaGeneral(request);
        assertEquals(400, response.getCode());
        assertEquals("Serie must contain only alphanumeric characters.", response.getMsg());
    }

    // ==================== 参数校验分支: chno ====================

    @Test
    @DisplayName("chno 为 null/空时应返回400")
    void testValidate_ChnoEmpty() {
        UD07VehicleSpecificationRequest request = new UD07VehicleSpecificationRequest("ABC12", null);
        UD07VehicleSpecificationResponse response = service.getHdocRecDataVdaKolaGeneral(request);
        assertEquals(400, response.getCode());
        assertEquals("Chno is required.", response.getMsg());

        request = new UD07VehicleSpecificationRequest("ABC12", "");
        response = service.getHdocRecDataVdaKolaGeneral(request);
        assertEquals(400, response.getCode());
        assertEquals("Chno is required.", response.getMsg());
    }

    @Test
    @DisplayName("chno 超过10字符时应返回400")
    void testValidate_ChnoTooLong() {
        UD07VehicleSpecificationRequest request = new UD07VehicleSpecificationRequest("ABC12", "12345678901");
        UD07VehicleSpecificationResponse response = service.getHdocRecDataVdaKolaGeneral(request);
        assertEquals(400, response.getCode());
        assertEquals("Chno must be at most 10 characters.", response.getMsg());
    }

    @Test
    @DisplayName("chno 包含非数字字符时应返回400")
    void testValidate_ChnoInvalidChars() {
        UD07VehicleSpecificationRequest request = new UD07VehicleSpecificationRequest("ABC12", "1234A");
        UD07VehicleSpecificationResponse response = service.getHdocRecDataVdaKolaGeneral(request);
        assertEquals(400, response.getCode());
        assertEquals("Chno must contain only digits.", response.getMsg());
    }

    // ==================== 分支: voList 为 null ====================

    @Test
    @DisplayName("voList 为 null 时应返回404")
    void testGetVehicleSpec_VoListNull() {
        when(ud07Mapper.selectVehicleSpecification("ABC12", "12345")).thenReturn(null);

        UD07VehicleSpecificationRequest request = new UD07VehicleSpecificationRequest("ABC12", "12345");
        UD07VehicleSpecificationResponse response = service.getHdocRecDataVdaKolaGeneral(request);

        assertEquals(404, response.getCode());
        assertEquals("Record not found.", response.getMsg());
        assertNull(response.getData());
        verify(ud07Mapper, times(1)).selectVehicleSpecification("ABC12", "12345");
    }

    @Test
    @DisplayName("voList 为空列表时应返回404")
    void testGetVehicleSpec_VoListEmpty() {
        when(ud07Mapper.selectVehicleSpecification("ABC12", "12345"))
                .thenReturn(Collections.emptyList());

        UD07VehicleSpecificationRequest request = new UD07VehicleSpecificationRequest("ABC12", "12345");
        UD07VehicleSpecificationResponse response = service.getHdocRecDataVdaKolaGeneral(request);

        assertEquals(404, response.getCode());
        assertEquals("Record not found.", response.getMsg());
        assertNull(response.getData());
        verify(ud07Mapper, times(1)).selectVehicleSpecification("ABC12", "12345");
    }

    // ==================== 分支: combinedCustomerAdap 处理 ====================

    @Test
    @DisplayName("customerAdap 有多行不同值时用换行拼接")
    void testGetVehicleSpec_CustomerAdapCombined() {
        UD07VehicleSpecificationVO vo1 = createBaseVO();
        vo1.setCustomerAdap("EU-STD");
        UD07VehicleSpecificationVO vo2 = createBaseVO();
        vo2.setCustomerAdap("JP-CUST");

        when(ud07Mapper.selectVehicleSpecification("ABC12", "12345"))
                .thenReturn(Arrays.asList(vo1, vo2));
        when(ud07Mapper.selectKolaVariants("FAM001", "VAR001"))
                .thenReturn(null);

        UD07VehicleSpecificationRequest request = new UD07VehicleSpecificationRequest("ABC12", "12345");
        UD07VehicleSpecificationResponse response = service.getHdocRecDataVdaKolaGeneral(request);

        assertEquals(200, response.getCode());
        assertEquals("EU-STD\nJP-CUST", response.getData().getCustomerAdap());
        verify(ud07Mapper, times(1)).selectVehicleSpecification("ABC12", "12345");
        verify(ud07Mapper, times(1)).selectKolaVariants("FAM001", "VAR001");
    }

    @Test
    @DisplayName("customerAdap 含 null 值时被过滤，不为空时正常拼接")
    void testGetVehicleSpec_CustomerAdapWithNull() {
        UD07VehicleSpecificationVO vo1 = createBaseVO();
        vo1.setCustomerAdap(null);
        UD07VehicleSpecificationVO vo2 = createBaseVO();
        vo2.setCustomerAdap("JP-CUST");

        when(ud07Mapper.selectVehicleSpecification("ABC12", "12345"))
                .thenReturn(Arrays.asList(vo1, vo2));
        when(ud07Mapper.selectKolaVariants("FAM001", "VAR001"))
                .thenReturn(null);

        UD07VehicleSpecificationResponse response = service.getHdocRecDataVdaKolaGeneral(
                new UD07VehicleSpecificationRequest("ABC12", "12345"));

        assertEquals(200, response.getCode());
        // null 被过滤，只有 "JP-CUST"
        assertEquals("JP-CUST", response.getData().getCustomerAdap());
    }

    @Test
    @DisplayName("所有 customerAdap 为 null 时流结果为空，回退到 vo.getCustomerAdap()")
    void testGetVehicleSpec_CustomerAdapAllNullFallback() {
        // 两个项的 customerAdap 都为 null → filter 全部排除 → 流结果 ""
        // combinedCustomerAdap.isEmpty()=true → 回退到 vo.getCustomerAdap()
        UD07VehicleSpecificationVO vo = createBaseVO();
        vo.setCustomerAdap(null);
        UD07VehicleSpecificationVO vo2 = createBaseVO();
        vo2.setCustomerAdap(null);

        when(ud07Mapper.selectVehicleSpecification("ABC12", "12345"))
                .thenReturn(Arrays.asList(vo, vo2));
        when(ud07Mapper.selectKolaVariants("FAM001", "VAR001"))
                .thenReturn(null);

        UD07VehicleSpecificationResponse response = service.getHdocRecDataVdaKolaGeneral(
                new UD07VehicleSpecificationRequest("ABC12", "12345"));

        assertEquals(200, response.getCode());
        // 回退到 vo.getCustomerAdap()，因设为 null，结果也为 null
        assertNull(response.getData().getCustomerAdap());
    }

    @Test
    @DisplayName("所有 customerAdap 为空字符串时流结果为空，回退到 vo.getCustomerAdap()")
    void testGetVehicleSpec_CustomerAdapAllEmptyFallback() {
        // 两个项的 customerAdap 都为 "" → filter 排除 → 流结果 ""
        // combinedCustomerAdap.isEmpty()=true → 回退到 vo.getCustomerAdap() → null
        UD07VehicleSpecificationVO vo = createBaseVO();
        vo.setCustomerAdap(null);
        UD07VehicleSpecificationVO vo2 = createBaseVO();
        vo2.setCustomerAdap("");

        when(ud07Mapper.selectVehicleSpecification("ABC12", "12345"))
                .thenReturn(Arrays.asList(vo, vo2));
        when(ud07Mapper.selectKolaVariants("FAM001", "VAR001"))
                .thenReturn(null);

        UD07VehicleSpecificationResponse response = service.getHdocRecDataVdaKolaGeneral(
                new UD07VehicleSpecificationRequest("ABC12", "12345"));

        assertEquals(200, response.getCode());
        // 空字符串被过滤 → 流结果为空 → 回退到 vo.getCustomerAdap() → null
        assertNull(response.getData().getCustomerAdap());
    }

    // ==================== 分支: variantVOList 为 null ====================

    @Test
    @DisplayName("variantVOList 为 null 时应返回空 kolaVariants 列表")
    void testGetVehicleSpec_KolaVariantsNull() {
        UD07VehicleSpecificationVO vo = createBaseVO();

        when(ud07Mapper.selectVehicleSpecification("ABC12", "12345"))
                .thenReturn(Collections.singletonList(vo));
        when(ud07Mapper.selectKolaVariants("FAM001", "VAR001"))
                .thenReturn(null);

        UD07VehicleSpecificationRequest request = new UD07VehicleSpecificationRequest("ABC12", "12345");
        UD07VehicleSpecificationResponse response = service.getHdocRecDataVdaKolaGeneral(request);

        assertEquals(200, response.getCode());
        assertNotNull(response.getData().getKolaVariants());
        assertTrue(response.getData().getKolaVariants().isEmpty());
    }

    // ==================== 分支: KOLA 变体 symbol/functionGroup/familyId 为 null
    // ====================

    @Test
    @DisplayName("KOLA 变体字段为 null 时应转换为空字符串处理")
    void testGetVehicleSpec_KolaVariantFieldsNull() {
        UD07VehicleSpecificationVO vo = createBaseVO();

        UD07KolaVariantVO variant = new UD07KolaVariantVO();
        variant.setSymbol(null);
        variant.setFunctionGroup(null);
        variant.setDescription("Test Desc");
        variant.setFamilyId(null);

        when(ud07Mapper.selectVehicleSpecification("ABC12", "12345"))
                .thenReturn(Collections.singletonList(vo));
        when(ud07Mapper.selectKolaVariants("FAM001", "VAR001"))
                .thenReturn(Collections.singletonList(variant));

        UD07VehicleSpecificationRequest request = new UD07VehicleSpecificationRequest("ABC12", "12345");
        UD07VehicleSpecificationResponse response = service.getHdocRecDataVdaKolaGeneral(request);

        assertEquals(200, response.getCode());
        assertEquals(1, response.getData().getKolaVariants().size());
        // symbol null → "" → format " " (8 spaces)
        assertEquals("        ", response.getData().getKolaVariants().get(0).getSymbol());
        // functionGroup null → "" + familyId null → "" → " " (4 spaces)
        assertEquals("    ", response.getData().getKolaVariants().get(0).getFunctionGroup());
    }

    // ==================== 分支: symbol/functionGroup 长度 >= 8/4 时截取
    // ====================

    @Test
    @DisplayName("symbol >= 8 字符时截取前8位，functionGroup >= 4 字符时截取前4位")
    void testGetVehicleSpec_KolaVariantTrimLongFields() {
        UD07VehicleSpecificationVO vo = createBaseVO();

        UD07KolaVariantVO variant = new UD07KolaVariantVO();
        variant.setSymbol("ABCDEFGHIJ"); // 10 chars → substring(0,8) = "ABCDEFGH"
        variant.setFunctionGroup("FUNCGROUP"); // 8 chars → substring(0,4) = "FUNC"
        variant.setDescription("Test Desc");
        variant.setFamilyId("FAM001");

        when(ud07Mapper.selectVehicleSpecification("ABC12", "12345"))
                .thenReturn(Collections.singletonList(vo));
        when(ud07Mapper.selectKolaVariants("FAM001", "VAR001"))
                .thenReturn(Collections.singletonList(variant));

        UD07VehicleSpecificationRequest request = new UD07VehicleSpecificationRequest("ABC12", "12345");
        UD07VehicleSpecificationResponse response = service.getHdocRecDataVdaKolaGeneral(request);

        assertEquals(200, response.getCode());
        assertEquals("ABCDEFGH", response.getData().getKolaVariants().get(0).getSymbol());
        // functionGroup截取前4位"FUNC" + familyId"FAM001" = "FUNCFAM001"
        assertEquals("FUNCFAM001", response.getData().getKolaVariants().get(0).getFunctionGroup());
    }

    // ==================== 分支: symbol < 8 / functionGroup < 4 时补空格
    // ====================

    @Test
    @DisplayName("symbol < 8 字符时补空格，functionGroup < 4 字符时补空格")
    void testGetVehicleSpec_KolaVariantPadShortFields() {
        UD07VehicleSpecificationVO vo = createBaseVO();

        UD07KolaVariantVO variant = new UD07KolaVariantVO();
        variant.setSymbol("AB"); // 2 chars → format "AB " (padded to 8)
        variant.setFunctionGroup("FG"); // 2 chars → format "FG " (padded to 4)
        variant.setDescription("Test Desc");
        variant.setFamilyId("FAM001");

        when(ud07Mapper.selectVehicleSpecification("ABC12", "12345"))
                .thenReturn(Collections.singletonList(vo));
        when(ud07Mapper.selectKolaVariants("FAM001", "VAR001"))
                .thenReturn(Collections.singletonList(variant));

        UD07VehicleSpecificationRequest request = new UD07VehicleSpecificationRequest("ABC12", "12345");
        UD07VehicleSpecificationResponse response = service.getHdocRecDataVdaKolaGeneral(request);

        assertEquals(200, response.getCode());
        assertEquals("AB      ", response.getData().getKolaVariants().get(0).getSymbol());
        assertEquals("FG  FAM001", response.getData().getKolaVariants().get(0).getFunctionGroup());
    }

    // ==================== 分支: 正常成功完整路径 ====================

    @Test
    @DisplayName("完整成功路径：含多个 KOLA 变体")
    void testGetVehicleSpec_FullSuccess() {
        UD07VehicleSpecificationVO vo = createBaseVO();
        vo.setCustomerAdap("EU-STD");

        UD07KolaVariantVO variant1 = new UD07KolaVariantVO("SYMBOL01", "GRP1", "Desc1", "FAM001");
        UD07KolaVariantVO variant2 = new UD07KolaVariantVO("SYMBOL02", "GRP2", "Desc2", "FAM001");

        when(ud07Mapper.selectVehicleSpecification("ABC12", "12345"))
                .thenReturn(Collections.singletonList(vo));
        when(ud07Mapper.selectKolaVariants("FAM001", "VAR001"))
                .thenReturn(Arrays.asList(variant1, variant2));

        UD07VehicleSpecificationRequest request = new UD07VehicleSpecificationRequest("ABC12", "12345");
        UD07VehicleSpecificationResponse response = service.getHdocRecDataVdaKolaGeneral(request);

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());
        assertEquals("ModelX", response.getData().getModel());
        assertEquals("EU-STD", response.getData().getCustomerAdap());
        assertEquals("20", response.getData().getBuildWeek());
        assertEquals("Truck", response.getData().getProductType());
        assertEquals("VIN123", response.getData().getVin());
        assertEquals("JP", response.getData().getCountryOfOperation());
        assertEquals("FAM001", response.getData().getFamilyId());
        assertEquals("VAR001", response.getData().getVariantId());
        assertEquals(2, response.getData().getKolaVariants().size());
    }

    // ==================== 分支: 系统异常 ====================

    @Test
    @DisplayName("系统异常时应返回500")
    void testGetVehicleSpec_Exception() {
        when(ud07Mapper.selectVehicleSpecification(anyString(), anyString()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD07VehicleSpecificationRequest request = new UD07VehicleSpecificationRequest("ABC12", "12345");
        UD07VehicleSpecificationResponse response = service.getHdocRecDataVdaKolaGeneral(request);

        assertEquals(500, response.getCode());
        assertEquals("System error. Please try again later.", response.getMsg());
        assertNull(response.getData());
        verify(ud07Mapper, times(1)).selectVehicleSpecification("ABC12", "12345");
    }

    // ==================== 辅助方法 ====================

    private UD07VehicleSpecificationVO createBaseVO() {
        UD07VehicleSpecificationVO vo = new UD07VehicleSpecificationVO();
        vo.setModel("ModelX");
        vo.setCustomerAdap("EU-STD");
        vo.setBuildWeek("20");
        vo.setProductType("Truck");
        vo.setVin("VIN123");
        vo.setCountryOfOperation("JP");
        vo.setFamilyId("FAM001");
        vo.setVariantId("VAR001");
        return vo;
    }
}
