package com.web.app.test;

import com.web.app.dto.UD07VehicleSpecificationResponse;
import com.web.app.entity.VehicleBasicInfo;
import com.web.app.entity.KolaVariantSymbol;
import com.web.app.entity.KapSnote;
import com.web.app.mapper.HdocRecDataVdaVariantMapper;
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
 * 覆盖所有分支：null分支、empty分支、空白分支、异常分支、正常分支
 * 分支覆盖率达到 100%
 */
@ExtendWith(MockitoExtension.class)
class UD07VehicleSpecificationServiceImplTest {

    @Mock
    private HdocRecDataVdaVariantMapper vdaVariantMapper;

    @InjectMocks
    private UD07VehicleSpecificationServiceImpl service;

    // =========================================================================
    // selectVehicleSpecification 方法
    // =========================================================================

    // -------------------------------------------------------
    // 分支: chassisNo == null
    // 分支: chassisNo.trim().isEmpty() (空字符串)
    // 分支: chassisNo.trim().isEmpty() (纯空格)
    // 预期: code=400, msg="底盘编号不能为空"
    // -------------------------------------------------------

    @Test
    @DisplayName("selectVehicleSpecification - chassisNo为null → 返回400")
    void chassisNoNull_returns400() {
        UD07VehicleSpecificationResponse response = service.selectVehicleSpecification(null);
        assertEquals(400, response.getCode());
        assertEquals("底盘编号不能为空", response.getMsg());
        assertNull(response.getData());
        verifyNoInteractions(vdaVariantMapper);
    }

    @Test
    @DisplayName("selectVehicleSpecification - chassisNo为空字符串 → 返回400")
    void chassisNoEmpty_returns400() {
        UD07VehicleSpecificationResponse response = service.selectVehicleSpecification("");
        assertEquals(400, response.getCode());
        assertEquals("底盘编号不能为空", response.getMsg());
        assertNull(response.getData());
        verifyNoInteractions(vdaVariantMapper);
    }

    @Test
    @DisplayName("selectVehicleSpecification - chassisNo为纯空格 → 返回400")
    void chassisNoBlank_returns400() {
        UD07VehicleSpecificationResponse response = service.selectVehicleSpecification("   ");
        assertEquals(400, response.getCode());
        assertEquals("底盘编号不能为空", response.getMsg());
        assertNull(response.getData());
        verifyNoInteractions(vdaVariantMapper);
    }

    // -------------------------------------------------------
    // 分支: chassisNo包含 "_" → split解析
    // 分支: basicInfo查询抛出异常 → 空列表
    // 分支: basicInfo == null || isEmpty → 404
    // -------------------------------------------------------

    @Test
    @DisplayName("selectVehicleSpecification - chassisNo包含_但basicInfo为null → 404")
    void chassisNoWithUnderscore_basicInfoNull_returns404() {
        when(vdaVariantMapper.selectVehicleBasicInfo("JPCT", "013945")).thenReturn(null);

        UD07VehicleSpecificationResponse response = service.selectVehicleSpecification("JPCT_013945");

        assertEquals(404, response.getCode());
        assertEquals("数据不存在", response.getMsg());
        assertNull(response.getData());
        verify(vdaVariantMapper).selectVehicleBasicInfo("JPCT", "013945");
        verify(vdaVariantMapper, never()).selectKolaVariantsByFamily(anyString(), anyString());
        verify(vdaVariantMapper, never()).selectSNoteBySerieChnr(anyString(), anyString());
    }

    @Test
    @DisplayName("selectVehicleSpecification - chassisNo包含_但basicInfo为空列表 → 404")
    void chassisNoWithUnderscore_basicInfoEmpty_returns404() {
        when(vdaVariantMapper.selectVehicleBasicInfo("JPCT", "013945")).thenReturn(Collections.emptyList());

        UD07VehicleSpecificationResponse response = service.selectVehicleSpecification("JPCT_013945");

        assertEquals(404, response.getCode());
        assertEquals("数据不存在", response.getMsg());
        verify(vdaVariantMapper).selectVehicleBasicInfo("JPCT", "013945");
    }

    // -------------------------------------------------------
    // 分支: chassisNo包含_ + basicInfo查询抛出异常
    // -------------------------------------------------------

    @Test
    @DisplayName("selectVehicleSpecification - basicInfo查询抛出异常→空列表→404")
    void basicInfoThrowsException_returns404() {
        when(vdaVariantMapper.selectVehicleBasicInfo("JPCT", "013945"))
                .thenThrow(new RuntimeException("DB error"));

        UD07VehicleSpecificationResponse response = service.selectVehicleSpecification("JPCT_013945");

        assertEquals(404, response.getCode());
        assertEquals("数据不存在", response.getMsg());
        verify(vdaVariantMapper).selectVehicleBasicInfo("JPCT", "013945");
    }

    // -------------------------------------------------------
    // 分支: chassisNo不含"_"且长度>=4 → substring(0,4), substring(4)
    // 分支: familyId/variantId为null → 空串
    // 分支: kolaVariants查询抛出异常 → 空列表
    // 分支: sNoteData查询抛出异常 → 空列表
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("selectVehicleSpecification - 不含_长度>=4, 各字段null, 查询异常→空symbols空sNotes")
    void chassisNoNoUnderscore_longEnough_allNullFields_exceptions() {
        // chassisNo="ABCD12345" → serie="ABCD", chnr="12345"
        VehicleBasicInfo info = new VehicleBasicInfo();
        info.setFamilyId(null);   // → ""
        info.setVariantId(null);  // → ""
        info.setModel(null);      // → ""
        info.setBuiltWeek(null);  // → ""
        info.setProductType(null);// → ""
        info.setVin(null);        // → ""
        info.setCustomerAdap(null);// → ""
        info.setCountryOfOperation(null); // → ""

        when(vdaVariantMapper.selectVehicleBasicInfo("ABCD", "12345"))
                .thenReturn(Collections.singletonList(info));
        when(vdaVariantMapper.selectKolaVariantsByFamily("", ""))
                .thenThrow(new RuntimeException("KOLA error"));
        when(vdaVariantMapper.selectSNoteBySerieChnr("ABCD", "12345"))
                .thenThrow(new RuntimeException("SNote error"));

        UD07VehicleSpecificationResponse response = service.selectVehicleSpecification("ABCD12345");

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());

        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals("ABCD12345", data.get("chassisNo"));
        assertEquals("", data.get("model"));
        assertEquals("", data.get("builtWeek"));
        assertEquals("", data.get("productType"));
        assertEquals("", data.get("vin"));
        assertEquals("", data.get("engineNo"));
        assertEquals("", data.get("countryOfOperation"));
        assertNotNull(data.get("symbols"));
        assertTrue(((List<?>) data.get("symbols")).isEmpty());
        assertNotNull(data.get("sNotes"));
        assertTrue(((List<?>) data.get("sNotes")).isEmpty());

        verify(vdaVariantMapper).selectVehicleBasicInfo("ABCD", "12345");
        verify(vdaVariantMapper).selectKolaVariantsByFamily("", "");
        verify(vdaVariantMapper).selectSNoteBySerieChnr("ABCD", "12345");
    }

    // -------------------------------------------------------
    // 分支: chassisNo不含"_"且长度<4 → serie=chassisNo, chnr=""
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("selectVehicleSpecification - 不含_长度<4 → serie=全值, chnr=空串")
    void chassisNoNoUnderscore_short_serieIsFull() {
        VehicleBasicInfo info = new VehicleBasicInfo();
        info.setFamilyId("FAM");
        info.setVariantId("VAR");
        info.setModel("MODEL_X");
        info.setBuiltWeek("2026-30");
        info.setProductType("CAR");
        info.setVin("VIN123");
        info.setCustomerAdap("CUS_ADAP");
        info.setCountryOfOperation("AUS");

        when(vdaVariantMapper.selectVehicleBasicInfo("AB", "")).thenReturn(Collections.singletonList(info));
        when(vdaVariantMapper.selectKolaVariantsByFamily("FAM", "VAR")).thenReturn(null);
        when(vdaVariantMapper.selectSNoteBySerieChnr("AB", "")).thenReturn(null);

        UD07VehicleSpecificationResponse response = service.selectVehicleSpecification("AB");

        assertEquals(200, response.getCode());
        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals("AB", data.get("chassisNo"));
        assertEquals("MODEL_X", data.get("model"));
        assertEquals("2026-30", data.get("builtWeek"));
        assertEquals("CAR", data.get("productType"));
        assertEquals("VIN123", data.get("vin"));
        assertEquals("CUS_ADAP", data.get("engineNo"));
        assertEquals("AUS", data.get("countryOfOperation"));

        verify(vdaVariantMapper).selectVehicleBasicInfo("AB", "");
        verify(vdaVariantMapper).selectKolaVariantsByFamily("FAM", "VAR");
        verify(vdaVariantMapper).selectSNoteBySerieChnr("AB", "");
    }

    // -------------------------------------------------------
    // 分支: kolaVariants有数据 → 遍历symbols
    // 分支: sNoteData有数据 → 遍历sNotes（split + trim空值过滤）
    // 分支: symbolStr/functionGroup为null → 空串
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("selectVehicleSpecification - 完整数据：含symbols、sNotes、各字段非空")
    void fullData_withSymbols_andSNotes() {
        VehicleBasicInfo info = new VehicleBasicInfo();
        info.setFamilyId("FAM001");
        info.setVariantId("VAR001");
        info.setModel("MODEL_Y");
        info.setBuiltWeek("2026-25");
        info.setProductType("TRUCK");
        info.setVin("JTE1234567890");
        info.setCustomerAdap("ENG123");
        info.setCountryOfOperation("JPN");

        when(vdaVariantMapper.selectVehicleBasicInfo("ABCD", "67890"))
                .thenReturn(Collections.singletonList(info));

        KolaVariantSymbol sym1 = new KolaVariantSymbol();
        sym1.setSymbolStr("SYM001");
        sym1.setFunctionGroup("GROUP_A");

        KolaVariantSymbol sym2 = new KolaVariantSymbol();
        sym2.setSymbolStr(null);     // → ""
        sym2.setFunctionGroup(null); // → ""

        when(vdaVariantMapper.selectKolaVariantsByFamily("FAM001", "VAR001"))
                .thenReturn(Arrays.asList(sym1, sym2));

        KapSnote sn1 = new KapSnote();
        sn1.setSnoteNo("SN001 SN002");  // split → ["SN001", "SN002"]
        KapSnote sn2 = new KapSnote();
        sn2.setSnoteNo("");             // trim().isEmpty() → false, 跳过split
        KapSnote sn3 = new KapSnote();
        sn3.setSnoteNo(null);           // null → 跳过
        KapSnote sn4 = new KapSnote();
        sn4.setSnoteNo("   ");          // trim().isEmpty() → true, 跳过

        when(vdaVariantMapper.selectSNoteBySerieChnr("ABCD", "67890"))
                .thenReturn(Arrays.asList(sn1, sn2, sn3, sn4));

        UD07VehicleSpecificationResponse response = service.selectVehicleSpecification("ABCD67890");

        assertEquals(200, response.getCode());
        Map<String, Object> data = (Map<String, Object>) response.getData();

        // symbols验证
        List<Map<String, String>> symbols = (List<Map<String, String>>) data.get("symbols");
        assertEquals(2, symbols.size());
        assertEquals("SYM001", symbols.get(0).get("symbol"));
        assertEquals("GROUP_A", symbols.get(0).get("description"));
        assertEquals("", symbols.get(1).get("symbol"));
        assertEquals("", symbols.get(1).get("description"));

        // sNotes验证: 只从sn1解析出2个
        List<String> sNotes = (List<String>) data.get("sNotes");
        assertEquals(2, sNotes.size());
        assertEquals("SN001", sNotes.get(0));
        assertEquals("SN002", sNotes.get(1));

        verify(vdaVariantMapper).selectVehicleBasicInfo("ABCD", "67890");
        verify(vdaVariantMapper).selectKolaVariantsByFamily("FAM001", "VAR001");
        verify(vdaVariantMapper).selectSNoteBySerieChnr("ABCD", "67890");
    }

    // -------------------------------------------------------
    // 分支: chassisNo包含"_"且长度恰好4->无substring，走split
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("selectVehicleSpecification - chassisNo包含_且长度=5")
    void chassisNoWithUnderscore_shortAfterSplit() {
        when(vdaVariantMapper.selectVehicleBasicInfo("A", "B")).thenReturn(null);

        UD07VehicleSpecificationResponse response = service.selectVehicleSpecification("A_B");

        assertEquals(404, response.getCode());
        verify(vdaVariantMapper).selectVehicleBasicInfo("A", "B");
    }
}
