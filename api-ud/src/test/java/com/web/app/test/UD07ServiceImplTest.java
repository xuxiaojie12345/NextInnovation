package com.web.app.test;

import com.web.app.domain.VehicleSpecificationResponse;
import com.web.app.domain.VehicleSpecificationResponse.ChassisInfo;
import com.web.app.domain.VehicleSpecificationResponse.EngineInfo;
import com.web.app.mapper.UD07Mapper;
import com.web.app.service.impl.UD07ServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD07ServiceImpl 单元测试
 * getVehicleSpecification: chassisInfo==null / familyId+variantId null检查 / engineInfo==null
 */
class UD07ServiceImplTest {

    @Mock
    private UD07Mapper ud07Mapper;

    @InjectMocks
    private UD07ServiceImpl ud07Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("getVehicleSpecification() - chassisInfo为null")
    class ChassisInfoNullTest {

        @Test
        @DisplayName("底盘信息不存在时返回null")
        void testChassisInfoNullReturnsNull() {
            when(ud07Mapper.selectChassisInfo("SERIE1", "CHNR1")).thenReturn(null);

            VehicleSpecificationResponse result = ud07Service.getVehicleSpecification("SERIE1", "CHNR1");

            assertNull(result);
            verify(ud07Mapper, times(1)).selectChassisInfo("SERIE1", "CHNR1");
            verify(ud07Mapper, never()).selectEngineInfo(anyString(), anyString());
        }
    }

    @Nested
    @DisplayName("getVehicleSpecification() - familyId和variantId分支")
    class FamilyVariantTest {

        @Test
        @DisplayName("familyId和variantId均非null - engineInfo查询成功")
        void testFamilyAndVariantNotNullEngineFound() {
            ChassisInfo chassisInfo = new ChassisInfo();
            chassisInfo.setChassisNo("CHNR1");
            chassisInfo.setFamilyId("FAM001");
            chassisInfo.setVariantId("VAR001");
            chassisInfo.setSNoteNo("SNOTE001");

            EngineInfo engineInfo = new EngineInfo();
            engineInfo.setEngineNo("A01");
            engineInfo.setSymbolStr("SYMBOL01");
            engineInfo.setDescription("Engine Description");

            when(ud07Mapper.selectChassisInfo("SERIE1", "CHNR1")).thenReturn(chassisInfo);
            when(ud07Mapper.selectEngineInfo("FAM001", "VAR001")).thenReturn(engineInfo);

            VehicleSpecificationResponse result = ud07Service.getVehicleSpecification("SERIE1", "CHNR1");

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertSame(chassisInfo, result.getChassisInfo()),
                    () -> assertSame(engineInfo, result.getEngineInfo()),
                    () -> assertEquals("SNOTE001", result.getSNoteNo()),
                    () -> assertEquals("A01", result.getEngineInfo().getEngineNo()),
                    () -> assertEquals("SYMBOL01", result.getEngineInfo().getSymbolStr())
            );
            verify(ud07Mapper, times(1)).selectEngineInfo("FAM001", "VAR001");
        }

        @Test
        @DisplayName("familyId和variantId均非null - engineInfo为null时设默认值")
        void testFamilyAndVariantNotNullEngineNull() {
            ChassisInfo chassisInfo = new ChassisInfo();
            chassisInfo.setChassisNo("CHNR1");
            chassisInfo.setFamilyId("FAM001");
            chassisInfo.setVariantId("VAR001");
            chassisInfo.setSNoteNo("SNOTE001");

            when(ud07Mapper.selectChassisInfo("SERIE1", "CHNR1")).thenReturn(chassisInfo);
            when(ud07Mapper.selectEngineInfo("FAM001", "VAR001")).thenReturn(null);

            VehicleSpecificationResponse result = ud07Service.getVehicleSpecification("SERIE1", "CHNR1");

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertEquals("A01", result.getEngineInfo().getEngineNo()),
                    () -> assertEquals("", result.getEngineInfo().getSymbolStr()),
                    () -> assertEquals("", result.getEngineInfo().getDescription())
            );
        }

        @Test
        @DisplayName("familyId为null时使用默认EngineInfo")
        void testFamilyIdNullUsesDefaultEngine() {
            ChassisInfo chassisInfo = new ChassisInfo();
            chassisInfo.setChassisNo("CHNR1");
            chassisInfo.setFamilyId(null);
            chassisInfo.setVariantId("VAR001");

            when(ud07Mapper.selectChassisInfo("SERIE1", "CHNR1")).thenReturn(chassisInfo);

            VehicleSpecificationResponse result = ud07Service.getVehicleSpecification("SERIE1", "CHNR1");

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertEquals("A01", result.getEngineInfo().getEngineNo()),
                    () -> assertEquals("", result.getEngineInfo().getSymbolStr())
            );
            verify(ud07Mapper, never()).selectEngineInfo(anyString(), anyString());
        }

        @Test
        @DisplayName("variantId为null时使用默认EngineInfo")
        void testVariantIdNullUsesDefaultEngine() {
            ChassisInfo chassisInfo = new ChassisInfo();
            chassisInfo.setChassisNo("CHNR1");
            chassisInfo.setFamilyId("FAM001");
            chassisInfo.setVariantId(null);

            when(ud07Mapper.selectChassisInfo("SERIE1", "CHNR1")).thenReturn(chassisInfo);

            VehicleSpecificationResponse result = ud07Service.getVehicleSpecification("SERIE1", "CHNR1");

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertEquals("A01", result.getEngineInfo().getEngineNo())
            );
            verify(ud07Mapper, never()).selectEngineInfo(anyString(), anyString());
        }
    }
}
