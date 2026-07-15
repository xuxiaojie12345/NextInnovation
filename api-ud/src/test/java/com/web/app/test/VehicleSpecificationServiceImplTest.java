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
    }
}
