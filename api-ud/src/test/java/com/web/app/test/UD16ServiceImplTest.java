package com.web.app.test;

import com.web.app.domain.UD16Request;
import com.web.app.mapper.UD16Mapper;
import com.web.app.service.impl.UD16ServiceImpl;
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
 * UD16ServiceImpl 单元测试
 * processAdChange: serieChnr解析 + switch 3种operation + default异常
 */
class UD16ServiceImplTest {

    @Mock
    private UD16Mapper ud16Mapper;

    @InjectMocks
    private UD16ServiceImpl ud16Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("SerieChnr格式校验测试")
    class SerieChnrValidationTest {

        @Test
        @DisplayName("serieChnr为null时抛出异常")
        void testNullSerieChnr() {
            UD16Request request = new UD16Request();
            request.setOperation("CHECK");
            request.setSerieChnr(null);

            assertThrows(IllegalArgumentException.class,
                    () -> ud16Service.processAdChange(request));
        }

        @Test
        @DisplayName("serieChnr格式无效时抛出异常")
        void testInvalidSerieChnr() {
            UD16Request request = new UD16Request();
            request.setOperation("CHECK");
            request.setSerieChnr("INVALID");

            assertThrows(IllegalArgumentException.class,
                    () -> ud16Service.processAdChange(request));
        }

        @Test
        @DisplayName("serieChnr只有一部分时抛出异常")
        void testIncompleteSerieChnr() {
            UD16Request request = new UD16Request();
            request.setOperation("CHECK");
            request.setSerieChnr("SERIE ");

            assertThrows(IllegalArgumentException.class,
                    () -> ud16Service.processAdChange(request));
        }

        @Test
        @DisplayName("serieChnr以空格开头时抛出异常（parts[0]为空）")
        void testSerieChnrLeadingSpace() {
            UD16Request request = new UD16Request();
            request.setOperation("CHECK");
            request.setSerieChnr("  CHNR1");

            assertThrows(IllegalArgumentException.class,
                    () -> ud16Service.processAdChange(request));
        }
    }

    @Nested
    @DisplayName("CHECK 操作测试")
    class CheckOperationTest {

        @Test
        @DisplayName("CHECK - 记录存在时返回映射数据")
        void testCheckFound() {
            UD16Request request = new UD16Request();
            request.setOperation("CHECK");
            request.setSerieChnr("SERIE1 CHNR1");

            Map<String, Object> record = new LinkedHashMap<>();
            record.put("REASON", "Test reason");
            record.put("ACT", "ACTIVE");

            when(ud16Mapper.selectHdocAdcaChange("SERIE1", "CHNR1")).thenReturn(record);

            Map<String, Object> result = ud16Service.processAdChange(request);

            assertAll(
                    () -> assertEquals("SERIE1 CHNR1", result.get("serieChnr")),
                    () -> assertEquals("Test reason", result.get("desc")),
                    () -> assertEquals("ACTIVE", result.get("status")),
                    () -> assertNull(result.get("found"))
            );
        }

        @Test
        @DisplayName("CHECK - 记录不存在时返回found=false")
        void testCheckNotFound() {
            UD16Request request = new UD16Request();
            request.setOperation("CHECK");
            request.setSerieChnr("SERIE1 CHNR1");

            when(ud16Mapper.selectHdocAdcaChange("SERIE1", "CHNR1")).thenReturn(null);

            Map<String, Object> result = ud16Service.processAdChange(request);

            assertAll(
                    () -> assertFalse((Boolean) result.get("found")),
                    () -> assertNull(result.get("serieChnr"))
            );
        }
    }

    @Nested
    @DisplayName("ADD 操作测试")
    class AddOperationTest {

        @Test
        @DisplayName("ADD - 记录不存在时添加成功")
        void testAddSuccess() {
            UD16Request request = new UD16Request();
            request.setOperation("ADD");
            request.setSerieChnr("SERIE1 CHNR1");
            request.setDesc("New reason");

            when(ud16Mapper.selectHdocAdcaChange("SERIE1", "CHNR1")).thenReturn(null);

            Map<String, Object> result = ud16Service.processAdChange(request);

            assertEquals("添加成功", result.get("message"));
            verify(ud16Mapper, times(1)).insertHdocAdcaChange("SERIE1", "CHNR1", "New reason");
        }

        @Test
        @DisplayName("ADD - 记录已存在时抛出异常")
        void testAddAlreadyExists() {
            UD16Request request = new UD16Request();
            request.setOperation("ADD");
            request.setSerieChnr("SERIE1 CHNR1");

            when(ud16Mapper.selectHdocAdcaChange("SERIE1", "CHNR1")).thenReturn(new LinkedHashMap<>());

            assertThrows(IllegalArgumentException.class,
                    () -> ud16Service.processAdChange(request));
            verify(ud16Mapper, never()).insertHdocAdcaChange(anyString(), anyString(), anyString());
        }
    }

    @Nested
    @DisplayName("DELETE 操作测试")
    class DeleteOperationTest {

        @Test
        @DisplayName("DELETE - 逻辑删除成功")
        void testDeleteSuccess() {
            UD16Request request = new UD16Request();
            request.setOperation("DELETE");
            request.setSerieChnr("SERIE1 CHNR1");
            request.setUser("USER1");
            request.setProcess("PROC1");

            Map<String, Object> result = ud16Service.processAdChange(request);

            assertEquals("删除成功", result.get("message"));
            verify(ud16Mapper, times(1)).logicalDeleteHdocAdcaChange("SERIE1", "CHNR1", "USER1", "PROC1");
        }
    }

    @Nested
    @DisplayName("未知操作测试")
    class UnknownOperationTest {

        @Test
        @DisplayName("未知操作抛出异常")
        void testUnknownOperation() {
            UD16Request request = new UD16Request();
            request.setOperation("UNKNOWN");
            request.setSerieChnr("SERIE1 CHNR1");

            assertThrows(IllegalArgumentException.class,
                    () -> ud16Service.processAdChange(request));
        }
    }
}
