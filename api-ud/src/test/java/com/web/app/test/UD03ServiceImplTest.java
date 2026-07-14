package com.web.app.test;

import com.web.app.domain.entity.DocumentType;
import com.web.app.mapper.UD03Mapper;
import com.web.app.service.impl.UD03ServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD03ServiceImpl 单元测试
 * getAllDocumentTypes: 直接委托 Mapper，无分支逻辑
 */
class UD03ServiceImplTest {

    @Mock
    private UD03Mapper ud03Mapper;

    @InjectMocks
    private UD03ServiceImpl ud03Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("getAllDocumentTypes() 方法测试")
    class GetAllDocumentTypesTest {

        @Test
        @DisplayName("正常返回文档类型列表 - 多条记录")
        void testGetAllDocumentTypesReturnsList() {
            DocumentType dt1 = new DocumentType();
            dt1.setDoctype("TYPE1");
            dt1.setDescription("Description 1");

            DocumentType dt2 = new DocumentType();
            dt2.setDoctype("TYPE2");
            dt2.setDescription("Description 2");

            List<DocumentType> expectedList = Arrays.asList(dt1, dt2);
            when(ud03Mapper.selectAllDocumentTypes()).thenReturn(expectedList);

            List<DocumentType> result = ud03Service.getAllDocumentTypes();

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertEquals(2, result.size()),
                    () -> assertEquals("TYPE1", result.get(0).getDoctype()),
                    () -> assertEquals("TYPE2", result.get(1).getDoctype())
            );
            verify(ud03Mapper, times(1)).selectAllDocumentTypes();
        }

        @Test
        @DisplayName("返回空列表 - 没有文档类型数据")
        void testGetAllDocumentTypesReturnsEmptyList() {
            when(ud03Mapper.selectAllDocumentTypes()).thenReturn(Collections.emptyList());

            List<DocumentType> result = ud03Service.getAllDocumentTypes();

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertTrue(result.isEmpty())
            );
            verify(ud03Mapper, times(1)).selectAllDocumentTypes();
        }

        @Test
        @DisplayName("返回单条记录")
        void testGetAllDocumentTypesReturnsSingleItem() {
            DocumentType dt = new DocumentType();
            dt.setDoctype("SINGLE");
            dt.setDescription("Single Type");

            when(ud03Mapper.selectAllDocumentTypes()).thenReturn(Collections.singletonList(dt));

            List<DocumentType> result = ud03Service.getAllDocumentTypes();

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertEquals(1, result.size()),
                    () -> assertEquals("SINGLE", result.get(0).getDoctype())
            );
            verify(ud03Mapper, times(1)).selectAllDocumentTypes();
        }
    }
}
