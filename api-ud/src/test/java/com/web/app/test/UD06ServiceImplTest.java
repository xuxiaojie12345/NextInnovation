package com.web.app.test;

import com.web.app.domain.SaveModificationsQueryResponse;
import com.web.app.mapper.UD06Mapper;
import com.web.app.service.impl.UD06ServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD06ServiceImpl 单元测试
 * selectHdocAdcaModification: null/isEmpty检查 + try/catch
 */
class UD06ServiceImplTest {

    @Mock
    private UD06Mapper ud06Mapper;

    @InjectMocks
    private UD06ServiceImpl ud06Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("selectHdocAdcaModification() - 零/空列表分支")
    class EmptyListTest {

        @Test
        @DisplayName("Mapper返回null时返回null")
        void testNullListReturnsNull() {
            when(ud06Mapper.selectHdocAdcaModification("SERIE1", "CHNO1")).thenReturn(null);

            SaveModificationsQueryResponse result = ud06Service.selectHdocAdcaModification("SERIE1", "CHNO1");

            assertNull(result);
        }

        @Test
        @DisplayName("Mapper返回空列表时返回null")
        void testEmptyListReturnsNull() {
            when(ud06Mapper.selectHdocAdcaModification("SERIE1", "CHNO1"))
                    .thenReturn(Collections.emptyList());

            SaveModificationsQueryResponse result = ud06Service.selectHdocAdcaModification("SERIE1", "CHNO1");

            assertNull(result);
        }
    }

    @Nested
    @DisplayName("selectHdocAdcaModification() - 正常返回测试")
    class NormalReturnTest {

        @Test
        @DisplayName("返回第一条记录并设置chassisSerie和chassisNumber")
        void testReturnsFirstRecordWithSerieAndChno() {
            SaveModificationsQueryResponse record = new SaveModificationsQueryResponse();
            record.setDoctype("OM");
            record.setVersion("V1");

            List<SaveModificationsQueryResponse> recordList = new ArrayList<>();
            recordList.add(record);

            when(ud06Mapper.selectHdocAdcaModification("SERIE1", "CHNO1")).thenReturn(recordList);

            SaveModificationsQueryResponse result = ud06Service.selectHdocAdcaModification("SERIE1", "CHNO1");

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertEquals("SERIE1", result.getChassisSerie()),
                    () -> assertEquals("CHNO1", result.getChassisNumber()),
                    () -> assertEquals("OM", result.getDoctype()),
                    () -> assertEquals("V1", result.getVersion())
            );
        }

        @Test
        @DisplayName("多条记录时返回第一条")
        void testMultipleRecordsReturnsFirst() {
            SaveModificationsQueryResponse rec1 = new SaveModificationsQueryResponse();
            rec1.setDoctype("FIRST");
            SaveModificationsQueryResponse rec2 = new SaveModificationsQueryResponse();
            rec2.setDoctype("SECOND");

            List<SaveModificationsQueryResponse> recordList = new ArrayList<>();
            recordList.add(rec1);
            recordList.add(rec2);

            when(ud06Mapper.selectHdocAdcaModification("SERIE1", "CHNO1")).thenReturn(recordList);

            SaveModificationsQueryResponse result = ud06Service.selectHdocAdcaModification("SERIE1", "CHNO1");

            assertEquals("FIRST", result.getDoctype());
        }
    }

    @Nested
    @DisplayName("selectHdocAdcaModification() - 异常处理")
    class ExceptionTest {

        @Test
        @DisplayName("Mapper抛出异常时重新抛出")
        void testMapperExceptionRethrown() {
            when(ud06Mapper.selectHdocAdcaModification(anyString(), anyString()))
                    .thenThrow(new RuntimeException("DB error"));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> ud06Service.selectHdocAdcaModification("SERIE1", "CHNO1"));

            assertEquals("DB error", exception.getMessage());
        }
    }
}
