package com.web.app.test;

import com.web.app.domain.UD10SearchRequest;
import com.web.app.domain.entity.HdocVariable;
import com.web.app.mapper.UD11Mapper;
import com.web.app.service.impl.UD11ServiceImpl;
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
 * UD11ServiceImpl 单元测试
 * search: 直接委托 Mapper，无分支逻辑
 */
class UD11ServiceImplTest {

    @Mock
    private UD11Mapper ud11Mapper;

    @InjectMocks
    private UD11ServiceImpl ud11Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("search() 方法测试")
    class SearchTest {

        @Test
        @DisplayName("正常搜索返回变量列表 - 多条记录")
        void testSearchReturnsList() {
            UD10SearchRequest request = new UD10SearchRequest();
            request.setVariable("TEST_VAR");
            request.setType("STRING");

            HdocVariable hv1 = new HdocVariable();
            hv1.setVariable("VAR1");
            hv1.setType("STRING");
            HdocVariable hv2 = new HdocVariable();
            hv2.setVariable("VAR2");
            hv2.setType("NUMBER");

            List<HdocVariable> expectedList = Arrays.asList(hv1, hv2);
            when(ud11Mapper.searchHdocVariables(request)).thenReturn(expectedList);

            List<HdocVariable> result = ud11Service.search(request);

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertEquals(2, result.size()),
                    () -> assertEquals("VAR1", result.get(0).getVariable()),
                    () -> assertEquals("VAR2", result.get(1).getVariable())
            );
            verify(ud11Mapper, times(1)).searchHdocVariables(request);
        }

        @Test
        @DisplayName("搜索返回空列表 - 无匹配记录")
        void testSearchReturnsEmptyList() {
            UD10SearchRequest request = new UD10SearchRequest();
            when(ud11Mapper.searchHdocVariables(request)).thenReturn(Collections.emptyList());

            List<HdocVariable> result = ud11Service.search(request);

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertTrue(result.isEmpty())
            );
            verify(ud11Mapper, times(1)).searchHdocVariables(request);
        }

        @Test
        @DisplayName("搜索返回单条记录")
        void testSearchReturnsSingleItem() {
            UD10SearchRequest request = new UD10SearchRequest();
            HdocVariable hv = new HdocVariable();
            hv.setVariable("ONLY_ONE");
            hv.setType("STRING");

            when(ud11Mapper.searchHdocVariables(request)).thenReturn(Collections.singletonList(hv));

            List<HdocVariable> result = ud11Service.search(request);

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertEquals(1, result.size()),
                    () -> assertEquals("ONLY_ONE", result.get(0).getVariable())
            );
            verify(ud11Mapper, times(1)).searchHdocVariables(request);
        }

        @Test
        @DisplayName("搜索请求为null时仍委托Mapper")
        void testSearchWithNullRequest() {
            when(ud11Mapper.searchHdocVariables(null)).thenReturn(Collections.emptyList());

            List<HdocVariable> result = ud11Service.search(null);

            assertNotNull(result);
            assertTrue(result.isEmpty());
            verify(ud11Mapper, times(1)).searchHdocVariables(null);
        }
    }
}
