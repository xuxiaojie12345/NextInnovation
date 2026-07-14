package com.web.app.test;

import com.web.app.domain.GenerateDocumentQueryResponse;
import com.web.app.mapper.UD04Mapper;
import com.web.app.service.impl.UD04ServiceImpl;
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
 * UD04ServiceImpl 单元测试
 * selectGeneratedDocument: null检查 + act判断(if/else) + try/catch
 */
class UD04ServiceImplTest {

    @Mock
    private UD04Mapper ud04Mapper;

    @InjectMocks
    private UD04ServiceImpl ud04Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("selectGeneratedDocument() - response为null的情况")
    class ResponseNullTest {

        @Test
        @DisplayName("Mapper返回null时返回null")
        void testResponseNullReturnsNull() {
            when(ud04Mapper.selectGeneratedDocument("SERIE1", "CHNO1")).thenReturn(null);

            GenerateDocumentQueryResponse result = ud04Service.selectGeneratedDocument("SERIE1", "CHNO1", "DOCTYPE1");

            assertNull(result);
            verify(ud04Mapper, times(1)).selectGeneratedDocument("SERIE1", "CHNO1");
        }
    }

    @Nested
    @DisplayName("selectGeneratedDocument() - modifyDocLink分支测试")
    class ModifyDocLinkTest {

        @Test
        @DisplayName("act为'1'时设置modifyDocLink为ACTIVE")
        void testActIs1SetsActive() {
            GenerateDocumentQueryResponse response = new GenerateDocumentQueryResponse();
            response.setChassisNo("CHNO1");
            response.setModifyDocLink("1");

            when(ud04Mapper.selectGeneratedDocument("SERIE1", "CHNO1")).thenReturn(response);

            GenerateDocumentQueryResponse result = ud04Service.selectGeneratedDocument("SERIE1", "CHNO1", "DOCTYPE1");

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertEquals("ACTIVE", result.getModifyDocLink()),
                    () -> assertEquals("-EU", result.getMasterMarket()),
                    () -> assertEquals("v1.0.0", result.getHdocVersion()),
                    () -> assertNotNull(result.getDate())
            );
        }

        @Test
        @DisplayName("act为'ACTIVE'时设置modifyDocLink为ACTIVE")
        void testActIsActiveSetsActive() {
            GenerateDocumentQueryResponse response = new GenerateDocumentQueryResponse();
            response.setModifyDocLink("ACTIVE");

            when(ud04Mapper.selectGeneratedDocument("SERIE1", "CHNO1")).thenReturn(response);

            GenerateDocumentQueryResponse result = ud04Service.selectGeneratedDocument("SERIE1", "CHNO1", "DOCTYPE1");

            assertEquals("ACTIVE", result.getModifyDocLink());
        }

        @Test
        @DisplayName("act为'Y'时设置modifyDocLink为ACTIVE")
        void testActIsYSetsActive() {
            GenerateDocumentQueryResponse response = new GenerateDocumentQueryResponse();
            response.setModifyDocLink("Y");

            when(ud04Mapper.selectGeneratedDocument("SERIE1", "CHNO1")).thenReturn(response);

            GenerateDocumentQueryResponse result = ud04Service.selectGeneratedDocument("SERIE1", "CHNO1", "DOCTYPE1");

            assertEquals("ACTIVE", result.getModifyDocLink());
        }

        @Test
        @DisplayName("act为其他值时设置modifyDocLink为INACTIVE")
        void testActOtherSetsInactive() {
            GenerateDocumentQueryResponse response = new GenerateDocumentQueryResponse();
            response.setModifyDocLink("INACTIVE");

            when(ud04Mapper.selectGeneratedDocument("SERIE1", "CHNO1")).thenReturn(response);

            GenerateDocumentQueryResponse result = ud04Service.selectGeneratedDocument("SERIE1", "CHNO1", "DOCTYPE1");

            assertEquals("INACTIVE", result.getModifyDocLink());
        }

        @Test
        @DisplayName("act为null时设置modifyDocLink为INACTIVE")
        void testActNullSetsInactive() {
            GenerateDocumentQueryResponse response = new GenerateDocumentQueryResponse();
            response.setModifyDocLink(null);

            when(ud04Mapper.selectGeneratedDocument("SERIE1", "CHNO1")).thenReturn(response);

            GenerateDocumentQueryResponse result = ud04Service.selectGeneratedDocument("SERIE1", "CHNO1", "DOCTYPE1");

            assertEquals("INACTIVE", result.getModifyDocLink());
        }
    }

    @Nested
    @DisplayName("selectGeneratedDocument() - 异常处理测试")
    class ExceptionTest {

        @Test
        @DisplayName("Mapper抛出异常时重新抛出")
        void testMapperExceptionRethrown() {
            when(ud04Mapper.selectGeneratedDocument(anyString(), anyString()))
                    .thenThrow(new RuntimeException("DB error"));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> ud04Service.selectGeneratedDocument("SERIE1", "CHNO1", "DOCTYPE1"));

            assertEquals("DB error", exception.getMessage());
        }
    }
}
