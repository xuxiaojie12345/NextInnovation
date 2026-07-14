package com.web.app.test;

import com.web.app.mapper.UD22Mapper;
import com.web.app.service.impl.UD22ServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD22ServiceImpl 单元测试
 * getDocumentTypes: 直接委托 Mapper，无分支逻辑
 */
class UD22ServiceImplTest {

    @Mock
    private UD22Mapper ud22Mapper;

    @InjectMocks
    private UD22ServiceImpl ud22Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("getDocumentTypes() 方法测试")
    class GetDocumentTypesTest {

        @Test
        @DisplayName("正常返回文档类型列表 - 多条记录")
        void testGetDocumentTypesReturnsList() {
            Map<String, String> dt1 = new LinkedHashMap<>();
            dt1.put("doctype", "OM_001");
            dt1.put("description", "Owner's Manual");

            Map<String, String> dt2 = new LinkedHashMap<>();
            dt2.put("doctype", "SM_001");
            dt2.put("description", "Service Manual");

            List<Map<String, String>> expectedList = Arrays.asList(dt1, dt2);
            when(ud22Mapper.selectDocumentTypes()).thenReturn(expectedList);

            List<Map<String, String>> result = ud22Service.getDocumentTypes();

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertEquals(2, result.size()),
                    () -> assertEquals("OM_001", result.get(0).get("doctype"))
            );
            verify(ud22Mapper, times(1)).selectDocumentTypes();
        }

        @Test
        @DisplayName("返回空列表 - 无文档类型数据")
        void testGetDocumentTypesReturnsEmptyList() {
            when(ud22Mapper.selectDocumentTypes()).thenReturn(Collections.emptyList());

            List<Map<String, String>> result = ud22Service.getDocumentTypes();

            assertNotNull(result);
            assertTrue(result.isEmpty());
            verify(ud22Mapper, times(1)).selectDocumentTypes();
        }

        @Test
        @DisplayName("返回单条文档类型记录")
        void testGetDocumentTypesReturnsSingleItem() {
            Map<String, String> dt1 = new LinkedHashMap<>();
            dt1.put("doctype", "ONLY_TYPE");
            dt1.put("description", "Only Type");

            when(ud22Mapper.selectDocumentTypes()).thenReturn(Collections.singletonList(dt1));

            List<Map<String, String>> result = ud22Service.getDocumentTypes();

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertEquals(1, result.size()),
                    () -> assertEquals("ONLY_TYPE", result.get(0).get("doctype"))
            );
            verify(ud22Mapper, times(1)).selectDocumentTypes();
        }
    }
}
