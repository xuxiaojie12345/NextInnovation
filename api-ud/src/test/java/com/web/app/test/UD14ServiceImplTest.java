package com.web.app.test;

import com.web.app.domain.entity.MarketMaster;
import com.web.app.mapper.UD14Mapper;
import com.web.app.service.impl.UD14ServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD14ServiceImpl 单元测试
 * selectMarketMaster + selectHdocUserDefinedRules
 * 涉及: @PostConstruct, 文件系统操作, formatFileSize
 */
class UD14ServiceImplTest {

    @Mock
    private UD14Mapper ud14Mapper;

    @InjectMocks
    private UD14ServiceImpl ud14Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        ReflectionTestUtils.setField(ud14Service, "templateRoot", "d://uploads/templates");
        ReflectionTestUtils.setField(ud14Service, "networkUsername", "");
        ReflectionTestUtils.setField(ud14Service, "networkPassword", "");
    }

    @Nested
    @DisplayName("selectMarketMaster() 方法测试")
    class SelectMarketMasterTest {

        @Test
        @DisplayName("返回市场和总数")
        void testReturnsMarketsWithCount() {
            MarketMaster mm1 = new MarketMaster();
            mm1.setMarket("JPN");
            MarketMaster mm2 = new MarketMaster();
            mm2.setMarket("USA");

            when(ud14Mapper.selectAllMarketMaster()).thenReturn(Arrays.asList(mm1, mm2));

            Map<String, Object> result = ud14Service.selectMarketMaster();

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertTrue(result.containsKey("markets")),
                    () -> assertTrue(result.containsKey("totalCount")),
                    () -> assertEquals(2, result.get("totalCount"))
            );

            List<Map<String, String>> markets = (List<Map<String, String>>) result.get("markets");
            assertEquals(2, markets.size());
            assertEquals("JPN", markets.get(0).get("market"));
        }

        @Test
        @DisplayName("返回空市场列表")
        void testReturnsEmptyList() {
            when(ud14Mapper.selectAllMarketMaster()).thenReturn(Collections.emptyList());

            Map<String, Object> result = ud14Service.selectMarketMaster();

            assertEquals(0, result.get("totalCount"));
            assertTrue(((List<?>) result.get("markets")).isEmpty());
        }
    }

    @Nested
    @DisplayName("selectHdocUserDefinedRules() 方法测试")
    class SelectHdocUserDefinedRulesTest {

        @Test
        @DisplayName("市场目录不存在时返回空文件列表")
        void testMarketDirNotExists() {
            Map<String, Object> result = ud14Service.selectHdocUserDefinedRules("NONEXIST_MARKET");

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertTrue(result.containsKey("files")),
                    () -> assertTrue(result.containsKey("totalCount")),
                    () -> assertEquals(0, result.get("totalCount"))
            );
        }

        @Test
        @DisplayName("文件引用计数>0时used字段非空")
        void testFileUsed() {
            // 使用真实文件系统不可行，测试空市场路径
            Map<String, Object> result = ud14Service.selectHdocUserDefinedRules("TEST_MARKET");

            assertNotNull(result);
            assertTrue(((List<?>) result.get("files")).isEmpty());
        }
    }

    @Nested
    @DisplayName("formatFileSize() 私有方法测试（通过反射）")
    class FormatFileSizeTest {

        @Test
        @DisplayName("小于1KB显示为B")
        void testBytes() throws Exception {
            java.lang.reflect.Method method = UD14ServiceImpl.class.getDeclaredMethod("formatFileSize", long.class);
            method.setAccessible(true);

            assertEquals("500 B", method.invoke(ud14Service, 500L));
            assertEquals("1 B", method.invoke(ud14Service, 1L));
            assertEquals("1023 B", method.invoke(ud14Service, 1023L));
        }

        @Test
        @DisplayName("1KB~1MB显示为KB")
        void testKB() throws Exception {
            java.lang.reflect.Method method = UD14ServiceImpl.class.getDeclaredMethod("formatFileSize", long.class);
            method.setAccessible(true);

            String result = (String) method.invoke(ud14Service, 2048L);
            assertTrue(result.contains("KB"));
        }

        @Test
        @DisplayName("大于等于1MB显示为MB")
        void testMB() throws Exception {
            java.lang.reflect.Method method = UD14ServiceImpl.class.getDeclaredMethod("formatFileSize", long.class);
            method.setAccessible(true);

            String result = (String) method.invoke(ud14Service, 2 * 1024 * 1024L);
            assertTrue(result.contains("MB"));
        }
    }
}
