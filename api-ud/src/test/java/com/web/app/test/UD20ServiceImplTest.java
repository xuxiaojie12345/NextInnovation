package com.web.app.test;

import com.web.app.mapper.UD20Mapper;
import com.web.app.service.impl.UD20ServiceImpl;
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
 * UD20ServiceImpl 单元测试
 * getDocumentList: 直接委托 Mapper，无分支逻辑
 */
class UD20ServiceImplTest {

    @Mock
    private UD20Mapper ud20Mapper;

    @InjectMocks
    private UD20ServiceImpl ud20Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("getDocumentList() 方法测试")
    class GetDocumentListTest {

        @Test
        @DisplayName("正常返回文档列表 - 多条记录")
        void testGetDocumentListReturnsList() {
            Map<String, Object> doc1 = new LinkedHashMap<>();
            doc1.put("doctype", "DOC1");
            doc1.put("user", "USER1");

            Map<String, Object> doc2 = new LinkedHashMap<>();
            doc2.put("doctype", "DOC2");
            doc2.put("user", "USER2");

            List<Map<String, Object>> expectedList = Arrays.asList(doc1, doc2);
            when(ud20Mapper.selectHdocDocumentList("DOC", "=", "USER", "=", "2024-01-01", "="))
                    .thenReturn(expectedList);

            List<Map<String, Object>> result = ud20Service.getDocumentList(
                    "DOC", "=", "USER", "=", "2024-01-01", "=");

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertEquals(2, result.size()),
                    () -> assertEquals("DOC1", result.get(0).get("doctype"))
            );
            verify(ud20Mapper, times(1))
                    .selectHdocDocumentList("DOC", "=", "USER", "=", "2024-01-01", "=");
        }

        @Test
        @DisplayName("返回空列表")
        void testGetDocumentListReturnsEmptyList() {
            when(ud20Mapper.selectHdocDocumentList(anyString(), anyString(), anyString(),
                    anyString(), anyString(), anyString()))
                    .thenReturn(Collections.emptyList());

            List<Map<String, Object>> result = ud20Service.getDocumentList(
                    null, null, null, null, null, null);

            assertNotNull(result);
            assertTrue(result.isEmpty());
            verify(ud20Mapper, times(1))
                    .selectHdocDocumentList(null, null, null, null, null, null);
        }

        @Test
        @DisplayName("传递所有参数为null")
        void testGetDocumentListWithAllNullParams() {
            when(ud20Mapper.selectHdocDocumentList(null, null, null, null, null, null))
                    .thenReturn(Collections.emptyList());

            List<Map<String, Object>> result = ud20Service.getDocumentList(
                    null, null, null, null, null, null);

            assertNotNull(result);
            assertTrue(result.isEmpty());
            verify(ud20Mapper, times(1))
                    .selectHdocDocumentList(null, null, null, null, null, null);
        }
    }
}
