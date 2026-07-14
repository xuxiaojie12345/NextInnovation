package com.web.app.test;

import com.web.app.mapper.UD15Mapper;
import com.web.app.service.impl.UD15ServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD15ServiceImpl 单元测试
 * processVinPlate: switch 5种operation + default异常
 */
class UD15ServiceImplTest {

    @Mock
    private UD15Mapper ud15Mapper;

    @InjectMocks
    private UD15ServiceImpl ud15Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("viewInfo 操作测试")
    class ViewInfoTest {

        @Test
        @DisplayName("viewInfo - 记录存在时返回映射后的信息")
        void testViewInfoFound() {
            Map<String, Object> dbInfo = new LinkedHashMap<>();
            dbInfo.put("TYPE", "1");
            dbInfo.put("STATUS", "ACTIVE");
            dbInfo.put("MSG", "OK");
            dbInfo.put("REGISTER_DATETIME", "2024-01-01");
            dbInfo.put("DOC_READY", "Y");
            dbInfo.put("DOC_SENT", "Y");
            dbInfo.put("XML_DOC", "<doc>data</doc>");

            when(ud15Mapper.selectVinPlateInfo("SERIE1", "CHNR1")).thenReturn(dbInfo);

            Map<String, Object> result = ud15Service.processVinPlate("SERIE1", "CHNR1", "viewInfo", null);

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertEquals("SERIE1-CHNR1", result.get("chassisNumber")),
                    () -> assertEquals("1", result.get("plateType")),
                    () -> assertEquals("ACTIVE", result.get("status")),
                    () -> assertEquals("OK", result.get("errorMessage")),
                    () -> assertEquals("2024-01-01", result.get("def"))
            );
        }

        @Test
        @DisplayName("viewInfo - 记录不存在时抛出异常")
        void testViewInfoNotFound() {
            when(ud15Mapper.selectVinPlateInfo("SERIE1", "CHNR1")).thenReturn(null);

            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                    () -> ud15Service.processVinPlate("SERIE1", "CHNR1", "viewInfo", null));

            assertTrue(exception.getMessage().contains("not found"));
        }

        @Test
        @DisplayName("viewInfo - 字段缺失时使用默认空值")
        void testViewInfoWithMissingFields() {
            Map<String, Object> dbInfo = new LinkedHashMap<>();

            when(ud15Mapper.selectVinPlateInfo("SERIE1", "CHNR1")).thenReturn(dbInfo);

            Map<String, Object> result = ud15Service.processVinPlate("SERIE1", "CHNR1", "viewInfo", null);

            assertAll(
                    () -> assertEquals("", result.get("plateType")),
                    () -> assertEquals("", result.get("status")),
                    () -> assertEquals("", result.get("errorMessage"))
            );
        }
    }

    @Nested
    @DisplayName("setRegenerate 操作测试")
    class SetRegenerateTest {

        @Test
        @DisplayName("setRegenerate - 更新成功")
        void testSetRegenerateSuccess() {
            when(ud15Mapper.updateStatus("SERIE1", "CHNR1", "0", "USER1")).thenReturn(1);

            Map<String, Object> result = ud15Service.processVinPlate("SERIE1", "CHNR1", "setRegenerate", "USER1");

            assertEquals("Status updated successfully.", result.get("message"));
        }

        @Test
        @DisplayName("setRegenerate - 更新无记录时抛出异常")
        void testSetRegenerateNotFound() {
            when(ud15Mapper.updateStatus("SERIE1", "CHNR1", "0", "USER1")).thenReturn(0);

            assertThrows(IllegalArgumentException.class,
                    () -> ud15Service.processVinPlate("SERIE1", "CHNR1", "setRegenerate", "USER1"));
        }
    }

    @Nested
    @DisplayName("setOK 操作测试")
    class SetOKTest {

        @Test
        @DisplayName("setOK - 更新成功")
        void testSetOKSuccess() {
            when(ud15Mapper.updateStatus("SERIE1", "CHNR1", "1", "USER1")).thenReturn(1);

            Map<String, Object> result = ud15Service.processVinPlate("SERIE1", "CHNR1", "setOK", "USER1");

            assertEquals("Status updated successfully.", result.get("message"));
        }

        @Test
        @DisplayName("setOK - 更新无记录时抛出异常")
        void testSetOKNotFound() {
            when(ud15Mapper.updateStatus("SERIE1", "CHNR1", "1", "USER1")).thenReturn(0);

            assertThrows(IllegalArgumentException.class,
                    () -> ud15Service.processVinPlate("SERIE1", "CHNR1", "setOK", "USER1"));
        }
    }

    @Nested
    @DisplayName("changeToBasicInfo 操作测试")
    class ChangeToBasicInfoTest {

        @Test
        @DisplayName("changeToBasicInfo - 更新成功")
        void testChangeToBasicInfoSuccess() {
            when(ud15Mapper.updateStatusAndType("SERIE1", "CHNR1", "0", "1", "USER1")).thenReturn(1);

            Map<String, Object> result = ud15Service.processVinPlate("SERIE1", "CHNR1", "changeToBasicInfo", "USER1");

            assertEquals("Status and Type updated successfully.", result.get("message"));
        }

        @Test
        @DisplayName("changeToBasicInfo - 更新无记录时抛出异常")
        void testChangeToBasicInfoNotFound() {
            when(ud15Mapper.updateStatusAndType("SERIE1", "CHNR1", "0", "1", "USER1")).thenReturn(0);

            assertThrows(IllegalArgumentException.class,
                    () -> ud15Service.processVinPlate("SERIE1", "CHNR1", "changeToBasicInfo", "USER1"));
        }
    }

    @Nested
    @DisplayName("changeToAdvancedInfo 操作测试")
    class ChangeToAdvancedInfoTest {

        @Test
        @DisplayName("changeToAdvancedInfo - 更新成功")
        void testChangeToAdvancedInfoSuccess() {
            when(ud15Mapper.updateStatusAndType("SERIE1", "CHNR1", "0", "2", "USER1")).thenReturn(1);

            Map<String, Object> result = ud15Service.processVinPlate("SERIE1", "CHNR1", "changeToAdvancedInfo", "USER1");

            assertEquals("Status and Type updated successfully.", result.get("message"));
        }

        @Test
        @DisplayName("changeToAdvancedInfo - 更新无记录时抛出异常")
        void testChangeToAdvancedInfoNotFound() {
            when(ud15Mapper.updateStatusAndType("SERIE1", "CHNR1", "0", "2", "USER1")).thenReturn(0);

            assertThrows(IllegalArgumentException.class,
                    () -> ud15Service.processVinPlate("SERIE1", "CHNR1", "changeToAdvancedInfo", "USER1"));
        }
    }

    @Nested
    @DisplayName("未知操作测试")
    class UnknownOperationTest {

        @Test
        @DisplayName("未知操作抛出异常")
        void testUnknownOperation() {
            assertThrows(IllegalArgumentException.class,
                    () -> ud15Service.processVinPlate("SERIE1", "CHNR1", "unknownOp", null));
        }
    }
}
