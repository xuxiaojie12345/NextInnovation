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

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD14ServiceImpl 单元测试
 * selectMarketMaster + selectHdocUserDefinedRules
 * 涉及: @PostConstruct, 文件系统操作, formatFileSize
 */
@SuppressWarnings({"null", "unchecked"})
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
        ud14Service.init();
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
        @DisplayName("市场目录存在且有文件时返回文件列表")
        void testMarketDirWithFiles() throws IOException {
            Path tempDir = Files.createTempDirectory("ud14-test-");
            try {
                ReflectionTestUtils.setField(ud14Service, "templateRoot", tempDir.toString());

                Path marketDir = tempDir.resolve("JPN");
                Files.createDirectories(marketDir);
                Files.createFile(marketDir.resolve("template1.odt"));

                when(ud14Mapper.countByMarketAndFileName(eq("JPN"), eq("JPN/template1.odt"))).thenReturn(0);

                Map<String, Object> result = ud14Service.selectHdocUserDefinedRules("JPN");

                List<Map<String, Object>> files = (List<Map<String, Object>>) result.get("files");
                assertEquals(1, files.size());
                assertEquals("template1.odt", files.get(0).get("filename"));
                assertNotNull(files.get(0).get("lastModified"));
                assertNotNull(files.get(0).get("size"));
            } finally {
                try {
                    Files.walk(tempDir)
                            .sorted(Comparator.reverseOrder())
                            .forEach(p -> { try { Files.deleteIfExists(p); } catch (IOException e) {} });
                } catch (IOException e) {}
            }
        }

        @Test
        @DisplayName("marketDir是文件而非目录时返回空列表（else分支）")
        void testMarketDirIsFile() throws IOException {
            Path tempDir = Files.createTempDirectory("ud14-file-test-");
            try {
                ReflectionTestUtils.setField(ud14Service, "templateRoot", tempDir.toString());

                // 创建同名文件而非目录 → Files.exists=true, isDirectory=false
                Files.createFile(tempDir.resolve("JPN"));

                Map<String, Object> result = ud14Service.selectHdocUserDefinedRules("JPN");

                assertEquals(0, result.get("totalCount"));
                assertTrue(((List<?>) result.get("files")).isEmpty());
            } finally {
                Files.deleteIfExists(tempDir.resolve("JPN"));
                Files.deleteIfExists(tempDir);
            }
        }

        @Test
        @DisplayName("Files.list抛出IOException时被catch并返回空列表")
        void testMarketDirIOException() throws Exception {
            Path tempDir = Files.createTempDirectory("ud14-ioe-test-");
            try {
                ReflectionTestUtils.setField(ud14Service, "templateRoot", tempDir.toString());

                Path marketDir = tempDir.resolve("JPN");
                Files.createDirectories(marketDir);
                Files.createFile(marketDir.resolve("some.odt"));

                // icacls 拒绝 Everyone 读取目录权限 → Files.list() 抛 IOException
                new ProcessBuilder("icacls", marketDir.toString(), "/deny", "Everyone:(RD)")
                        .start().waitFor(5, java.util.concurrent.TimeUnit.SECONDS);

                Map<String, Object> result = ud14Service.selectHdocUserDefinedRules("JPN");

                assertEquals(0, result.get("totalCount"));
                assertTrue(((List<?>) result.get("files")).isEmpty());

                // 恢复权限以便 cleanup
                new ProcessBuilder("icacls", marketDir.toString(), "/grant", "Everyone:(RD)")
                        .start().waitFor(3, java.util.concurrent.TimeUnit.SECONDS);
            } finally {
                try {
                    new ProcessBuilder("icacls", tempDir.resolve("JPN").toString(), "/grant", "Everyone:(F)")
                            .start().waitFor(3, java.util.concurrent.TimeUnit.SECONDS);
                } catch (Exception ignored) {}
                try {
                    Files.walk(tempDir)
                            .sorted(Comparator.reverseOrder())
                            .forEach(p -> { try { Files.deleteIfExists(p); } catch (IOException e) {} });
                } catch (IOException ignored) {}
            }
        }

        @Test
        @DisplayName("多个文件时按文件名排序并返回")
        void testMultipleFilesSorted() throws IOException {
            Path tempDir = Files.createTempDirectory("ud14-sort-test-");
            try {
                ReflectionTestUtils.setField(ud14Service, "templateRoot", tempDir.toString());

                Path marketDir = tempDir.resolve("JPN");
                Files.createDirectories(marketDir);
                Files.createFile(marketDir.resolve("b_file.odt"));
                Files.createFile(marketDir.resolve("a_file.odt"));
                Files.createFile(marketDir.resolve("c_file.odt"));

                when(ud14Mapper.countByMarketAndFileName(anyString(), anyString())).thenReturn(0);

                Map<String, Object> result = ud14Service.selectHdocUserDefinedRules("JPN");

                List<Map<String, Object>> files = (List<Map<String, Object>>) result.get("files");
                assertEquals(3, files.size());
                assertEquals("a_file.odt", files.get(0).get("filename"));
                assertEquals("b_file.odt", files.get(1).get("filename"));
                assertEquals("c_file.odt", files.get(2).get("filename"));
            } finally {
                try {
                    Files.walk(tempDir)
                            .sorted(Comparator.reverseOrder())
                            .forEach(p -> { try { Files.deleteIfExists(p); } catch (IOException e) {} });
                } catch (IOException e) {}
            }
        }

        @Test
        @DisplayName("文件引用计数>0时used字段为TEMPLATE-VIN-PLATE")
        void testFileUsed() throws IOException {
            Path tempDir = Files.createTempDirectory("ud14-used-test-");
            try {
                ReflectionTestUtils.setField(ud14Service, "templateRoot", tempDir.toString());

                Path marketDir = tempDir.resolve("JPN");
                Files.createDirectories(marketDir);
                Files.createFile(marketDir.resolve("used_file.odt"));

                when(ud14Mapper.countByMarketAndFileName(eq("JPN"), eq("JPN/used_file.odt"))).thenReturn(1);

                Map<String, Object> result = ud14Service.selectHdocUserDefinedRules("JPN");

                List<Map<String, Object>> files = (List<Map<String, Object>>) result.get("files");
                assertEquals("TEMPLATE-VIN-PLATE", files.get(0).get("used"));
            } finally {
                try {
                    Files.walk(tempDir)
                            .sorted(Comparator.reverseOrder())
                            .forEach(p -> { try { Files.deleteIfExists(p); } catch (IOException e) {} });
                } catch (IOException e) {}
            }
        }
    }

    @Nested
    @DisplayName("loadFileAsResource() 方法测试")
    class LoadFileAsResourceTest {

        @Test
        @DisplayName("文件存在可读时返回Resource")
        void testLoadSuccess() throws IOException {
            Path tempDir = Files.createTempDirectory("ud14-load-test-");
            try {
                ReflectionTestUtils.setField(ud14Service, "templateRoot", tempDir.toString());

                Path marketDir = tempDir.resolve("JPN");
                Files.createDirectories(marketDir);
                Path testFile = marketDir.resolve("test.odt");
                Files.write(testFile, "hello".getBytes());

                org.springframework.core.io.Resource resource =
                        ud14Service.loadFileAsResource("JPN", "test.odt");

                assertNotNull(resource);
                assertTrue(resource.exists());
                assertTrue(resource.isReadable());
                assertEquals("test.odt", resource.getFilename());
            } finally {
                try {
                    Files.walk(tempDir)
                            .sorted(Comparator.reverseOrder())
                            .forEach(p -> { try { Files.deleteIfExists(p); } catch (IOException e) {} });
                } catch (IOException e) {}
            }
        }

        @Test
        @DisplayName("文件存在但不可读时抛出RuntimeException")
        void testLoadFileNotReadable() throws Exception {
            // Windows 上文件所有者总能读取文件，无法模拟此场景
            // 此分支仅在 Linux/Mac 上可通过 setReadable(false) 覆盖
            org.junit.jupiter.api.Assumptions.assumeFalse(
                    System.getProperty("os.name").toLowerCase().contains("win"),
                    "Windows does not support revoking owner read access");

            Path tempDir = Files.createTempDirectory("ud14-load-test-");
            Path testFile = null;
            try {
                ReflectionTestUtils.setField(ud14Service, "templateRoot", tempDir.toString());

                Path marketDir = tempDir.resolve("JPN");
                Files.createDirectories(marketDir);
                testFile = marketDir.resolve("test.odt");
                Files.write(testFile, "hello".getBytes());

                // 将文件设为不可读
                assertTrue(testFile.toFile().setReadable(false));

                RuntimeException exception = assertThrows(RuntimeException.class,
                        () -> ud14Service.loadFileAsResource("JPN", "test.odt"));

                String msg = exception.getMessage();
                assertTrue(msg.contains("not readable") || msg.contains("Failed to load"),
                        "Expected 'not readable' or 'Failed to load' in: " + msg);
            } finally {
                try {
                    if (testFile != null) testFile.toFile().setReadable(true);
                    Files.walk(tempDir)
                            .sorted(Comparator.reverseOrder())
                            .forEach(p -> { try { Files.deleteIfExists(p); } catch (IOException e) {} });
                } catch (IOException e) {}
            }
        }

        @Test
        @DisplayName("文件不存在时抛出RuntimeException")
        void testLoadFileNotFound() {
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> ud14Service.loadFileAsResource("JPN", "nonexistent.odt"));

            String msg = exception.getMessage();
            assertTrue(msg.contains("not found") || msg.contains("Failed to load"),
                    "Expected 'not found' or 'Failed to load' in: " + msg);
        }

        @Test
        @DisplayName("market为null时抛出异常")
        void testLoadWithNullMarket() {
            assertThrows(Exception.class,
                    () -> ud14Service.loadFileAsResource(null, "test.odt"));
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
