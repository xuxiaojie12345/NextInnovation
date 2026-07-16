package com.web.app.test;

import com.web.app.mapper.VehicleSpecificationMapper;
import com.web.app.service.impl.VehicleSpecificationServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("VehicleSpecificationServiceImpl Unit Tests")
class VehicleSpecificationServiceImplTest {

    @Mock private VehicleSpecificationMapper mapper;
    @InjectMocks private VehicleSpecificationServiceImpl service;

    @Nested @DisplayName("getVehicleSpecification()")
    class GetVehicleSpecification {
        @Test void shouldReturnCompleteData() {
            Map<String, Object> baseData = new LinkedHashMap<>();
            baseData.put("model", "FH16");
            baseData.put("BUILD", "2024-W01");
            baseData.put("PRODUCT_TYPE", "Truck");
            baseData.put("VIN", "YV2J4CUBXRA123456");
            baseData.put("SYMBOL_STR", "A");
            baseData.put("COUNTRY_OF_OPERATION", "JP");
            baseData.put("CUSTOMER_ADAP", "ADAP001");
            baseData.put("FAMILY_ID", "FAM001");
            baseData.put("VARIANT_ID", "VAR001");

            when(mapper.selectVehicleBase("FH", "12345")).thenReturn(baseData);
            when(mapper.selectKolaList("FAM001", "VAR001")).thenReturn(new ArrayList<>());

            Map<String, Object> result = service.getVehicleSpecification("FH", "12345");
            assertNotNull(result);
            assertEquals("FH16", result.get("model"));
            assertEquals("FAM001", result.get("familyId"));
            assertNotNull(result.get("kolaList"));
        }

        @Test void shouldReturnNullWhenNoBaseData() {
            when(mapper.selectVehicleBase(anyString(), anyString())).thenReturn(null);
            assertNull(service.getVehicleSpecification("FH", "99999"));
        }

        @Test void shouldReturnNullWhenBaseDataEmpty() {
            when(mapper.selectVehicleBase(anyString(), anyString())).thenReturn(new HashMap<>());
            assertNull(service.getVehicleSpecification("FH", "99999"));
        }

        @Test void shouldHandleNullKolaList() {
            Map<String, Object> baseData = new LinkedHashMap<>();
            baseData.put("model", "FH16");
            baseData.put("FAMILY_ID", "FAM001");
            baseData.put("VARIANT_ID", "VAR001");
            baseData.put("BUILD", "2024-W01");

            when(mapper.selectVehicleBase("FH", "12345")).thenReturn(baseData);
            when(mapper.selectKolaList("FAM001", "VAR001")).thenReturn(null);

            Map<String, Object> result = service.getVehicleSpecification("FH", "12345");
            assertNotNull(result);
            assertTrue(((List<?>) result.get("kolaList")).isEmpty());
        }

        @Test void shouldHandleNullFamilyAndVariant() {
            Map<String, Object> baseData = new LinkedHashMap<>();
            baseData.put("model", "FH16");
            baseData.put("BUILD", "2024-W01");

            when(mapper.selectVehicleBase("FH", "12345")).thenReturn(baseData);

            Map<String, Object> result = service.getVehicleSpecification("FH", "12345");
            assertNotNull(result);
            assertTrue(((List<?>) result.get("kolaList")).isEmpty());
        }

        @Test void shouldUseModelFallbackWhenModelKeyIsNull() {
            Map<String, Object> baseData = new LinkedHashMap<>();
            baseData.put("MODEL", "FALLBACK_MODEL");
            baseData.put("BUILD", "2024-W01");
            baseData.put("FAMILY_ID", "FAM001");
            baseData.put("VARIANT_ID", "VAR001");

            when(mapper.selectVehicleBase("FH", "12345")).thenReturn(baseData);
            when(mapper.selectKolaList("FAM001", "VAR001")).thenReturn(new ArrayList<>());

            Map<String, Object> result = service.getVehicleSpecification("FH", "12345");
            assertNotNull(result);
            assertEquals("FALLBACK_MODEL", result.get("model"));
        }

        @Test void shouldReturnEmptyKolaListWhenVariantIdNull() {
            Map<String, Object> baseData = new LinkedHashMap<>();
            baseData.put("model", "FH16");
            baseData.put("BUILD", "2024-W01");
            baseData.put("FAMILY_ID", "FAM001");
            // VARIANT_ID is null - deliberately not set

            when(mapper.selectVehicleBase("FH", "12345")).thenReturn(baseData);

            Map<String, Object> result = service.getVehicleSpecification("FH", "12345");
            assertNotNull(result);
            assertTrue(((List<?>) result.get("kolaList")).isEmpty());
        }

        @Test void shouldReturnEmptyKolaListWhenFamilyIdNull() {
            Map<String, Object> baseData = new LinkedHashMap<>();
            baseData.put("model", "FH16");
            baseData.put("BUILD", "2024-W01");
            baseData.put("VARIANT_ID", "VAR001");
            // FAMILY_ID is null - deliberately not set

            when(mapper.selectVehicleBase("FH", "12345")).thenReturn(baseData);

            Map<String, Object> result = service.getVehicleSpecification("FH", "12345");
            assertNotNull(result);
            assertTrue(((List<?>) result.get("kolaList")).isEmpty());
        }

        @Test void shouldTransformKolaListItems() {
            Map<String, Object> baseData = new LinkedHashMap<>();
            baseData.put("model", "FH16");
            baseData.put("BUILD", "2024-W01");
            baseData.put("FAMILY_ID", "FAM001");
            baseData.put("VARIANT_ID", "VAR001");

            List<Map<String, Object>> rawKolaList = new ArrayList<>();
            Map<String, Object> item1 = new HashMap<>();
            item1.put("SYMBOL", "S1");
            item1.put("DESCRIPTION", "Desc1");
            rawKolaList.add(item1);
            Map<String, Object> item2 = new HashMap<>();
            item2.put("SYMBOL", "S2");
            item2.put("DESCRIPTION", "Desc2");
            rawKolaList.add(item2);

            when(mapper.selectVehicleBase("FH", "12345")).thenReturn(baseData);
            when(mapper.selectKolaList("FAM001", "VAR001")).thenReturn(rawKolaList);

            Map<String, Object> result = service.getVehicleSpecification("FH", "12345");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> kolaList = (List<Map<String, Object>>) result.get("kolaList");
            assertEquals(2, kolaList.size());
            assertEquals("S1", kolaList.get(0).get("symbol"));
            assertEquals("Desc1", kolaList.get(0).get("description"));
            assertEquals("S2", kolaList.get(1).get("symbol"));
            assertEquals("Desc2", kolaList.get(1).get("description"));
        }
    }
}
