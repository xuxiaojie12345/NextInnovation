package com.web.app.test;

import com.web.app.mapper.UD21Mapper;
import com.web.app.service.impl.UD21ServiceImpl;
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
 * UD21ServiceImpl 单元测试
 * getMarket: 直接委托 Mapper，无分支逻辑
 */
class UD21ServiceImplTest {

    @Mock
    private UD21Mapper ud21Mapper;

    @InjectMocks
    private UD21ServiceImpl ud21Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("getMarket() 方法测试")
    class GetMarketTest {

        @Test
        @DisplayName("正常返回市场列表 - 多条记录")
        void testGetMarketReturnsList() {
            Map<String, String> m1 = new LinkedHashMap<>();
            m1.put("market", "JPN");
            m1.put("description", "Japan");

            Map<String, String> m2 = new LinkedHashMap<>();
            m2.put("market", "USA");
            m2.put("description", "United States");

            List<Map<String, String>> expectedList = Arrays.asList(m1, m2);
            when(ud21Mapper.selectMarket()).thenReturn(expectedList);

            List<Map<String, String>> result = ud21Service.getMarket();

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertEquals(2, result.size()),
                    () -> assertEquals("JPN", result.get(0).get("market"))
            );
            verify(ud21Mapper, times(1)).selectMarket();
        }

        @Test
        @DisplayName("返回空列表 - 无市场数据")
        void testGetMarketReturnsEmptyList() {
            when(ud21Mapper.selectMarket()).thenReturn(Collections.emptyList());

            List<Map<String, String>> result = ud21Service.getMarket();

            assertNotNull(result);
            assertTrue(result.isEmpty());
            verify(ud21Mapper, times(1)).selectMarket();
        }

        @Test
        @DisplayName("返回单条市场记录")
        void testGetMarketReturnsSingleItem() {
            Map<String, String> m1 = new LinkedHashMap<>();
            m1.put("market", "CHN");
            m1.put("description", "China");

            when(ud21Mapper.selectMarket()).thenReturn(Collections.singletonList(m1));

            List<Map<String, String>> result = ud21Service.getMarket();

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertEquals(1, result.size()),
                    () -> assertEquals("CHN", result.get(0).get("market"))
            );
            verify(ud21Mapper, times(1)).selectMarket();
        }
    }
}
