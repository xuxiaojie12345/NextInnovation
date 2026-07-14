package com.web.app.test;

import com.web.app.domain.UD08SearchRequest;
import com.web.app.domain.UD09BatchDeleteRequest;
import com.web.app.domain.UD09BatchDeleteResponse;
import com.web.app.domain.entity.HdocUserDefinedRules;
import com.web.app.mapper.UD09Mapper;
import com.web.app.service.impl.UD09ServiceImpl;
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
 * UD09ServiceImpl 单元测试
 * UD09Search + UD09DeleteSelected (含循环+try/catch+failedCount/deletedCount逻辑)
 */
class UD09ServiceImplTest {

    @Mock
    private UD09Mapper ud09Mapper;

    @InjectMocks
    private UD09ServiceImpl ud09Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("UD09Search() 方法测试")
    class UD09SearchTest {

        @Test
        @DisplayName("搜索返回结果列表")
        void testSearchReturnsList() {
            UD08SearchRequest request = new UD08SearchRequest();
            HdocUserDefinedRules rule = new HdocUserDefinedRules();
            rule.setPc("PC1");
            when(ud09Mapper.searchUserDefinedRules(request)).thenReturn(Collections.singletonList(rule));

            List<HdocUserDefinedRules> result = ud09Service.UD09Search(request);

            assertEquals(1, result.size());
            assertEquals("PC1", result.get(0).getPc());
        }

        @Test
        @DisplayName("搜索返回空列表")
        void testSearchReturnsEmpty() {
            UD08SearchRequest request = new UD08SearchRequest();
            when(ud09Mapper.searchUserDefinedRules(request)).thenReturn(Collections.emptyList());

            List<HdocUserDefinedRules> result = ud09Service.UD09Search(request);

            assertTrue(result.isEmpty());
        }
    }

    @Nested
    @DisplayName("UD09DeleteSelected() 方法测试")
    class UD09DeleteSelectedTest {

        @Test
        @DisplayName("全部删除成功")
        void testDeleteAllSuccess() {
            UD09BatchDeleteRequest req1 = new UD09BatchDeleteRequest();
            req1.setProductClass("PC1");
            req1.setNumber("100");
            req1.setMarket("JPN");
            UD09BatchDeleteRequest req2 = new UD09BatchDeleteRequest();
            req2.setProductClass("PC2");
            req2.setNumber("200");
            req2.setMarket("USA");

            when(ud09Mapper.selectByPrimaryKey("PC1", "100", "JPN"))
                    .thenReturn(new HdocUserDefinedRules());
            when(ud09Mapper.selectByPrimaryKey("PC2", "200", "USA"))
                    .thenReturn(new HdocUserDefinedRules());

            UD09BatchDeleteResponse result = ud09Service.UD09DeleteSelected(Arrays.asList(req1, req2));

            assertAll(
                    () -> assertEquals(2, result.getDeletedCount()),
                    () -> assertEquals(0, result.getFailedCount()),
                    () -> assertEquals("2 records deleted successfully.", result.getMessage())
            );
            verify(ud09Mapper, times(1)).deleteByPrimaryKey("PC1", "100", "JPN");
            verify(ud09Mapper, times(1)).deleteByPrimaryKey("PC2", "200", "USA");
        }

        @Test
        @DisplayName("部分成功 - 记录不存在导致失败")
        void testDeletePartialFailure() {
            UD09BatchDeleteRequest req1 = new UD09BatchDeleteRequest();
            req1.setProductClass("PC1");
            req1.setNumber("100");
            req1.setMarket("JPN");
            UD09BatchDeleteRequest req2 = new UD09BatchDeleteRequest();
            req2.setProductClass("PC2");
            req2.setNumber("200");
            req2.setMarket("USA");

            when(ud09Mapper.selectByPrimaryKey("PC1", "100", "JPN"))
                    .thenReturn(new HdocUserDefinedRules());
            when(ud09Mapper.selectByPrimaryKey("PC2", "200", "USA"))
                    .thenReturn(null);

            UD09BatchDeleteResponse result = ud09Service.UD09DeleteSelected(Arrays.asList(req1, req2));

            assertAll(
                    () -> assertEquals(1, result.getDeletedCount()),
                    () -> assertEquals(1, result.getFailedCount()),
                    () -> assertTrue(result.getMessage().contains("records deleted"))
            );
            verify(ud09Mapper, times(1)).deleteByPrimaryKey("PC1", "100", "JPN");
            verify(ud09Mapper, never()).deleteByPrimaryKey("PC2", "200", "USA");
        }

        @Test
        @DisplayName("全部失败 - 所有记录不存在")
        void testDeleteAllFailed() {
            UD09BatchDeleteRequest req1 = new UD09BatchDeleteRequest();
            req1.setProductClass("PC1");
            req1.setNumber("100");
            req1.setMarket("JPN");

            when(ud09Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(null);

            UD09BatchDeleteResponse result = ud09Service.UD09DeleteSelected(Collections.singletonList(req1));

            assertAll(
                    () -> assertEquals(0, result.getDeletedCount()),
                    () -> assertEquals(1, result.getFailedCount()),
                    () -> assertEquals("Failed to delete records. Please try again.", result.getMessage())
            );
        }

        @Test
        @DisplayName("Mapper抛出异常时失败计数增加")
        void testDeleteWithException() {
            UD09BatchDeleteRequest req1 = new UD09BatchDeleteRequest();
            req1.setProductClass("PC1");
            req1.setNumber("100");
            req1.setMarket("JPN");

            when(ud09Mapper.selectByPrimaryKey("PC1", "100", "JPN"))
                    .thenThrow(new RuntimeException("DB error"));

            UD09BatchDeleteResponse result = ud09Service.UD09DeleteSelected(Collections.singletonList(req1));

            assertAll(
                    () -> assertEquals(0, result.getDeletedCount()),
                    () -> assertEquals(1, result.getFailedCount())
            );
        }

        @Test
        @DisplayName("空列表请求返回全0")
        void testDeleteEmptyList() {
            UD09BatchDeleteResponse result = ud09Service.UD09DeleteSelected(Collections.emptyList());

            assertAll(
                    () -> assertEquals(0, result.getDeletedCount()),
                    () -> assertEquals(0, result.getFailedCount()),
                    () -> assertEquals("0 records deleted successfully.", result.getMessage())
            );
        }
    }
}
