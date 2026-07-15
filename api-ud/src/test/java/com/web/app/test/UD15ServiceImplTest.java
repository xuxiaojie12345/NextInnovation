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

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * XML_DOC 测试数据 - PrintItemName（用于测试 parsePrintItems）
 */
class TestXml {

    static final String PRINT_ITEMS = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
            + "<root>"
            + "  <PrintItem><PrintItemName>ItemA</PrintItemName></PrintItem>"
            + "  <PrintItem><PrintItemName>ItemB</PrintItemName></PrintItem>"
            + "  <PrintItem><PrintItemName>  ItemC  </PrintItemName></PrintItem>"
            + "</root>";

    static final String PRINT_ITEMS_WITH_EMPTY = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
            + "<root>"
            + "  <PrintItem><PrintItemName>ItemA</PrintItemName></PrintItem>"
            + "  <PrintItem><PrintItemName>  </PrintItemName></PrintItem>"
            + "  <PrintItem><PrintItemName></PrintItemName></PrintItem>"
            + "</root>";

    static final String NO_PRINT_ITEMS = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
            + "<root><OtherTag>data</OtherTag></root>";

    static final String VP_DATA = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
            + "<root>"
            + "  <Variant><Name>Color</Name><Value>Red</Value></Variant>"
            + "  <Variant><Name>Engine</Name><Value>V8</Value></Variant>"
            + "</root>";

    static final String VP_DATA_MISSING_FIELDS = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
            + "<root>"
            + "  <Variant><Name>OnlyName</Name></Variant>"
            + "  <Variant><Value>OnlyValue</Value></Variant>"
            + "  <Variant><Other>NoNameNoValue</Other></Variant>"
            + "</root>";

    static final String NO_VP_DATA = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
            + "<root><SomeData>test</SomeData></root>";

    static final String INVALID_XML = "this is not xml at all";
}

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

        @Test
        @DisplayName("viewInfo - REGISTER_DATETIME含T时只保留日期部分")
        void testViewInfoDatetimeWithT() {
            Map<String, Object> dbInfo = new LinkedHashMap<>();
            dbInfo.put("REGISTER_DATETIME", "2024-06-15T10:30:00");

            when(ud15Mapper.selectVinPlateInfo("SERIE1", "CHNR1")).thenReturn(dbInfo);

            Map<String, Object> result = ud15Service.processVinPlate("SERIE1", "CHNR1", "viewInfo", null);

            assertEquals("2024-06-15", result.get("def"));
        }

        @Test
        @DisplayName("viewInfo - XML_DOC为null时printItems和vpData为空串")
        void testViewInfoNullXml() {
            Map<String, Object> dbInfo = new LinkedHashMap<>();
            dbInfo.put("XML_DOC", null);

            when(ud15Mapper.selectVinPlateInfo("SERIE1", "CHNR1")).thenReturn(dbInfo);

            Map<String, Object> result = ud15Service.processVinPlate("SERIE1", "CHNR1", "viewInfo", null);

            assertEquals("", result.get("printItems"));
            assertEquals("", result.get("vpData"));
        }

        @Test
        @DisplayName("viewInfo - XML_DOC为空串时printItems和vpData为空串")
        void testViewInfoEmptyXml() {
            Map<String, Object> dbInfo = new LinkedHashMap<>();
            dbInfo.put("XML_DOC", "");

            when(ud15Mapper.selectVinPlateInfo("SERIE1", "CHNR1")).thenReturn(dbInfo);

            Map<String, Object> result = ud15Service.processVinPlate("SERIE1", "CHNR1", "viewInfo", null);

            assertEquals("", result.get("printItems"));
            assertEquals("", result.get("vpData"));
        }

        @Test
        @DisplayName("viewInfo - XML_DOC含PrintItemName时解析printItems")
        void testViewInfoParsePrintItems() {
            Map<String, Object> dbInfo = new LinkedHashMap<>();
            dbInfo.put("XML_DOC", TestXml.PRINT_ITEMS);

            when(ud15Mapper.selectVinPlateInfo("SERIE1", "CHNR1")).thenReturn(dbInfo);

            Map<String, Object> result = ud15Service.processVinPlate("SERIE1", "CHNR1", "viewInfo", null);

            assertEquals("ItemA, ItemB, ItemC", result.get("printItems"));
        }

        @Test
        @DisplayName("viewInfo - PrintItemName含空文本时自动跳过")
        void testViewInfoPrintItemsWithEmpty() {
            Map<String, Object> dbInfo = new LinkedHashMap<>();
            dbInfo.put("XML_DOC", TestXml.PRINT_ITEMS_WITH_EMPTY);

            when(ud15Mapper.selectVinPlateInfo("SERIE1", "CHNR1")).thenReturn(dbInfo);

            Map<String, Object> result = ud15Service.processVinPlate("SERIE1", "CHNR1", "viewInfo", null);

            assertEquals("ItemA", result.get("printItems"));
        }

        @Test
        @DisplayName("viewInfo - XML_DOC不含PrintItemName时printItems为空串")
        void testViewInfoNoPrintItems() {
            Map<String, Object> dbInfo = new LinkedHashMap<>();
            dbInfo.put("XML_DOC", TestXml.NO_PRINT_ITEMS);

            when(ud15Mapper.selectVinPlateInfo("SERIE1", "CHNR1")).thenReturn(dbInfo);

            Map<String, Object> result = ud15Service.processVinPlate("SERIE1", "CHNR1", "viewInfo", null);

            assertEquals("", result.get("printItems"));
        }

        @Test
        @DisplayName("viewInfo - XML_DOC含Variant时解析vpData")
        void testViewInfoParseVpData() {
            Map<String, Object> dbInfo = new LinkedHashMap<>();
            dbInfo.put("XML_DOC", TestXml.VP_DATA);

            when(ud15Mapper.selectVinPlateInfo("SERIE1", "CHNR1")).thenReturn(dbInfo);

            Map<String, Object> result = ud15Service.processVinPlate("SERIE1", "CHNR1", "viewInfo", null);

            assertEquals("Color=Red, Engine=V8", result.get("vpData"));
        }

        @Test
        @DisplayName("viewInfo - Variant缺少Name或Value时解析为等号")
        void testViewInfoVpDataMissingFields() {
            Map<String, Object> dbInfo = new LinkedHashMap<>();
            dbInfo.put("XML_DOC", TestXml.VP_DATA_MISSING_FIELDS);

            when(ud15Mapper.selectVinPlateInfo("SERIE1", "CHNR1")).thenReturn(dbInfo);

            Map<String, Object> result = ud15Service.processVinPlate("SERIE1", "CHNR1", "viewInfo", null);

            assertEquals("OnlyName=, =OnlyValue, =", result.get("vpData"));
        }

        @Test
        @DisplayName("viewInfo - XML_DOC不含Variant时vpData为空串")
        void testViewInfoNoVpData() {
            Map<String, Object> dbInfo = new LinkedHashMap<>();
            dbInfo.put("XML_DOC", TestXml.NO_VP_DATA);

            when(ud15Mapper.selectVinPlateInfo("SERIE1", "CHNR1")).thenReturn(dbInfo);

            Map<String, Object> result = ud15Service.processVinPlate("SERIE1", "CHNR1", "viewInfo", null);

            assertEquals("", result.get("vpData"));
        }

        @Test
        @DisplayName("viewInfo - XML_DOC格式非法时返回原始XML")
        void testViewInfoInvalidXml() {
            Map<String, Object> dbInfo = new LinkedHashMap<>();
            dbInfo.put("XML_DOC", TestXml.INVALID_XML);

            when(ud15Mapper.selectVinPlateInfo("SERIE1", "CHNR1")).thenReturn(dbInfo);

            Map<String, Object> result = ud15Service.processVinPlate("SERIE1", "CHNR1", "viewInfo", null);

            assertEquals(TestXml.INVALID_XML, result.get("printItems"));
            assertEquals(TestXml.INVALID_XML, result.get("vpData"));
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
