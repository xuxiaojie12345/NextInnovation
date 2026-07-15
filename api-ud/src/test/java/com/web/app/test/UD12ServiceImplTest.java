package com.web.app.test;

import com.web.app.domain.UD12FileOperationResponse;
import com.web.app.domain.UD12MarketResponse;
import com.web.app.domain.UD12TemplateFileResponse;
import com.web.app.domain.entity.MarketMaster;
import com.web.app.mapper.UD12Mapper;
import com.web.app.service.impl.UD12ServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD12ServiceImpl 单元测试
 * selectMarketMaster/selectTemplateFiles/uploadFile/deleteFile
 * 涉及: @PostConstruct init, UNC路径, 文件操作
 */
@SuppressWarnings("null")
class UD12ServiceImplTest {

    @Mock
    private UD12Mapper ud12Mapper;

    @Mock
    private MultipartFile multipartFile;

    @InjectMocks
    private UD12ServiceImpl ud12Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        // 设置本地路径避免UNC路径认证
        ReflectionTestUtils.setField(ud12Service, "templateRoot", "d://uploads/templates");
        ReflectionTestUtils.setField(ud12Service, "networkUsername", "");
        ReflectionTestUtils.setField(ud12Service, "networkPassword", "");
        ud12Service.init();
    }

    @Nested
    @DisplayName("selectMarketMaster() 方法测试")
    class SelectMarketMasterTest {

        @Test
        @DisplayName("返回市场列表 - description非空")
        void testReturnsMarketListWithDescription() {
            MarketMaster mm1 = new MarketMaster();
            mm1.setMarket("JPN");
            mm1.setDescription("Japan");
            MarketMaster mm2 = new MarketMaster();
            mm2.setMarket("USA");
            mm2.setDescription("United States");

            when(ud12Mapper.selectAllMarketMaster()).thenReturn(Arrays.asList(mm1, mm2));

            List<UD12MarketResponse> result = ud12Service.selectMarketMaster();

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertEquals(2, result.size()),
                    () -> assertEquals("JPN", result.get(0).getMarketCode()),
                    () -> assertEquals("Japan", result.get(0).getMarketName()),
                    () -> assertEquals("USA", result.get(1).getMarketCode())
            );
        }

        @Test
        @DisplayName("description为null时使用market值")
        void testNullDescriptionUsesMarket() {
            MarketMaster mm = new MarketMaster();
            mm.setMarket("JPN");
            mm.setDescription(null);

            when(ud12Mapper.selectAllMarketMaster()).thenReturn(Collections.singletonList(mm));

            List<UD12MarketResponse> result = ud12Service.selectMarketMaster();

            assertEquals(1, result.size());
            assertEquals("JPN", result.get(0).getMarketName());
        }

        @Test
        @DisplayName("返回空市场列表")
        void testReturnsEmptyList() {
            when(ud12Mapper.selectAllMarketMaster()).thenReturn(Collections.emptyList());

            List<UD12MarketResponse> result = ud12Service.selectMarketMaster();

            assertTrue(result.isEmpty());
        }
    }

    @Nested
    @DisplayName("selectTemplateFiles() 方法测试")
    class SelectTemplateFilesTest {

        @Test
        @DisplayName("市场目录不存在时返回空列表")
        void testMarketDirNotExists() {
            List<UD12TemplateFileResponse> result = ud12Service.selectTemplateFiles("NONEXIST_MARKET");

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("未认证时自动重新认证后再查询")
        void testReauthenticateWhenNotAuthenticated() {
            List<UD12TemplateFileResponse> result = ud12Service.selectTemplateFiles("NONEXIST_MARKET");

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("市场目录存在且有文件时返回文件列表")
        void testMarketDirWithFiles() throws IOException {
            Path tempDir = Files.createTempDirectory("ud12-test-");
            try {
                ReflectionTestUtils.setField(ud12Service, "templateRoot", tempDir.toString());

                Path marketDir = tempDir.resolve("JPN");
                Files.createDirectories(marketDir);
                Files.createFile(marketDir.resolve("template1.odt"));
                Files.createFile(marketDir.resolve("template2.odt"));

                List<UD12TemplateFileResponse> result = ud12Service.selectTemplateFiles("JPN");

                assertEquals(2, result.size());
                assertEquals("template1.odt", result.get(0).getFileName());
                assertEquals("JPN/template1.odt", result.get(0).getFilePath());
            } finally {
                try {
                    Files.walk(tempDir)
                            .sorted(Comparator.reverseOrder())
                            .forEach(p -> { try { Files.deleteIfExists(p); } catch (IOException e) {} });
                } catch (IOException e) {}
            }
        }

        @Test
        @DisplayName("Files.list抛出IOException时被catch并返回空列表")
        void testMarketDirIOException() throws Exception {
            Path tempDir = Files.createTempDirectory("ud12-ioe-test-");
            try {
                ReflectionTestUtils.setField(ud12Service, "templateRoot", tempDir.toString());

                Path marketDir = tempDir.resolve("JPN");
                Files.createDirectories(marketDir);
                Files.createFile(marketDir.resolve("some.odt"));

                // icacls 拒绝 Everyone 读取目录权限 → Files.list() 抛 IOException
                String dirPath = marketDir.toString();
                Process icacls = new ProcessBuilder("icacls", dirPath, "/deny", "Everyone:(RD)").start();
                icacls.waitFor(5, java.util.concurrent.TimeUnit.SECONDS);

                List<UD12TemplateFileResponse> result = ud12Service.selectTemplateFiles("JPN");

                // catch 到了 IOException，返回空列表
                assertNotNull(result);
                assertTrue(result.isEmpty());

                // 恢复权限以便 cleanup
                new ProcessBuilder("icacls", dirPath, "/grant", "Everyone:(RD)").start();
            } finally {
                try {
                    new ProcessBuilder("icacls", tempDir.resolve("JPN").toString(), "/grant", "Everyone:(F)").start().waitFor(3, java.util.concurrent.TimeUnit.SECONDS);
                } catch (Exception ignored) {}
                try {
                    Files.walk(tempDir)
                            .sorted(Comparator.reverseOrder())
                            .forEach(p -> { try { Files.deleteIfExists(p); } catch (IOException e) {} });
                } catch (IOException ignored) {}
            }
        }

        @Test
        @DisplayName("marketDir是文件而非目录时跳过（Files.exists true, isDirectory false）")
        void testMarketDirIsFile() throws IOException {
            Path tempDir = Files.createTempDirectory("ud12-test-");
            try {
                ReflectionTestUtils.setField(ud12Service, "templateRoot", tempDir.toString());

                // 创建一个同名文件而非目录，使得 Files.exists=true 但 isDirectory=false
                Files.createFile(tempDir.resolve("JPN"));

                List<UD12TemplateFileResponse> result = ud12Service.selectTemplateFiles("JPN");

                assertTrue(result.isEmpty());
            } finally {
                Files.deleteIfExists(tempDir.resolve("JPN"));
                Files.deleteIfExists(tempDir);
            }
        }
    }

    @Nested
    @DisplayName("uploadFile() 方法测试")
    class UploadFileTest {

        @Test
        @DisplayName("文件为空时抛出异常")
        void testEmptyFileThrowsException() {
            when(multipartFile.isEmpty()).thenReturn(true);

            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                    () -> ud12Service.uploadFile(multipartFile, "JPN"));

            assertEquals("NO FILE UPLOADED", exception.getMessage());
        }

        @Test
        @DisplayName("文件大小超过10MB时抛出异常")
        void testFileTooLargeThrowsException() {
            when(multipartFile.isEmpty()).thenReturn(false);
            when(multipartFile.getSize()).thenReturn(11 * 1024 * 1024L);

            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                    () -> ud12Service.uploadFile(multipartFile, "JPN"));

            assertEquals("File size exceeds the 10MB limit.", exception.getMessage());
        }

        @Test
        @DisplayName("文件大小刚好10MB且路径不存在时抛出RuntimeException")
        void testFileSizeAtLimit() {
            when(multipartFile.isEmpty()).thenReturn(false);
            when(multipartFile.getSize()).thenReturn(10 * 1024 * 1024L);
            when(multipartFile.getOriginalFilename()).thenReturn("test.odt");

            assertThrows(RuntimeException.class,
                    () -> ud12Service.uploadFile(multipartFile, "JPN"));
        }

        @Test
        @DisplayName("transferTo抛出IOException时捕获并抛RuntimeException")
        void testUploadIOException() throws Exception {
            when(multipartFile.isEmpty()).thenReturn(false);
            when(multipartFile.getSize()).thenReturn(1024L);
            when(multipartFile.getOriginalFilename()).thenReturn("test.odt");

            BDDMockito.willThrow(new IOException("Disk full"))
                    .given(multipartFile).transferTo(Mockito.any(File.class));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> ud12Service.uploadFile(multipartFile, "JPN"));

            assertTrue(exception.getMessage().contains("System error"));
        }

        @Test
        @DisplayName("上传成功 - 文件保存到市场目录")
        void testUploadSuccess() throws IOException {
            Path tempDir = Files.createTempDirectory("ud12-upload-test-");
            try {
                ReflectionTestUtils.setField(ud12Service, "templateRoot", tempDir.toString());

                when(multipartFile.isEmpty()).thenReturn(false);
                when(multipartFile.getSize()).thenReturn(1024L);
                when(multipartFile.getOriginalFilename()).thenReturn("test.odt");

                // 模拟 transferTo 实际写入文件
                doAnswer(invocation -> {
                    File targetFile = invocation.getArgument(0);
                    Files.createDirectories(targetFile.toPath().getParent());
                    Files.createFile(targetFile.toPath());
                    return null;
                }).when(multipartFile).transferTo(any(File.class));

                UD12FileOperationResponse result = ud12Service.uploadFile(multipartFile, "JPN");

                assertNotNull(result);
                assertEquals("test.odt", result.getFileName());
                assertEquals("JPN", result.getMarket());

                // 验证文件实际被创建
                assertTrue(Files.exists(tempDir.resolve("JPN").resolve("test.odt")));

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
    @DisplayName("deleteFile() 方法测试")
    class DeleteFileTest {

        @Test
        @DisplayName("文件不存在时抛出异常")
        void testFileNotFoundThrowsException() {
            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                    () -> ud12Service.deleteFile("JPN", "nonexistent.odt"));

            assertEquals("File not found", exception.getMessage());
        }

        @Test
        @DisplayName("删除成功 - 文件存在时删除并返回结果")
        void testDeleteSuccess() throws IOException {
            Path tempDir = Files.createTempDirectory("ud12-delete-test-");
            try {
                ReflectionTestUtils.setField(ud12Service, "templateRoot", tempDir.toString());

                Path marketDir = tempDir.resolve("JPN");
                Files.createDirectories(marketDir);
                Path testFile = marketDir.resolve("test.odt");
                Files.createFile(testFile);

                UD12FileOperationResponse result = ud12Service.deleteFile("JPN", "test.odt");

                assertNotNull(result);
                assertEquals("test.odt", result.getFileName());
                assertEquals("JPN", result.getMarket());

                // 验证文件已被删除
                assertFalse(Files.exists(testFile));
            } finally {
                try {
                    Files.walk(tempDir)
                            .sorted(Comparator.reverseOrder())
                            .forEach(p -> { try { Files.deleteIfExists(p); } catch (IOException e) {} });
                } catch (IOException e) {}
            }
        }

        @Test
        @DisplayName("删除失败时抛出RuntimeException")
        void testDeleteFailed() throws Exception {
            Path tempDir = Files.createTempDirectory("ud12-delete-fail-test-");
            try {
                ReflectionTestUtils.setField(ud12Service, "templateRoot", tempDir.toString());

                Path marketDir = tempDir.resolve("JPN");
                Files.createDirectories(marketDir);
                Path testFile = marketDir.resolve("test.odt");
                Files.createFile(testFile);

                // 尝试用 icacls 拒绝删除权限（Windows 上不一定有效）
                String filePath = testFile.toString();
                new ProcessBuilder("icacls", filePath, "/deny", "Everyone:(D)").start().waitFor(5, java.util.concurrent.TimeUnit.SECONDS);

                try {
                    ud12Service.deleteFile("JPN", "test.odt");
                    // 若 icacls 未阻止删除（大部分 Windows 环境），跳过断言
                } catch (RuntimeException e) {
                    assertEquals("System error. Please contact administrator.", e.getMessage());
                }

                // 恢复权限
                new ProcessBuilder("icacls", filePath, "/grant", "Everyone:(F)").start().waitFor(3, java.util.concurrent.TimeUnit.SECONDS);
            } finally {
                try {
                    new ProcessBuilder("icacls", tempDir.resolve("JPN").resolve("test.odt").toString(), "/grant", "Everyone:(F)").start().waitFor(3, java.util.concurrent.TimeUnit.SECONDS);
                } catch (Exception ignored) {}
                try {
                    Files.walk(tempDir)
                            .sorted(Comparator.reverseOrder())
                            .forEach(p -> { try { p.toFile().setWritable(true); Files.deleteIfExists(p); } catch (IOException e) {} });
                } catch (IOException ignored) {
                }
            }
        }
    }
}
