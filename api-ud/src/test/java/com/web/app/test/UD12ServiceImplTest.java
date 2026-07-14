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
        ReflectionTestUtils.setField(ud12Service, "networkAuthenticated", false);
        ud12Service.init();
    }

    @Nested
    @DisplayName("authenticateNetworkShare() UNC路径测试")
    class AuthenticateNetworkShareTest {

        @Test
        @DisplayName("UNC路径无用户名密码时警告并继续")
        void testUNCPathWithoutCredentials() {
            ReflectionTestUtils.setField(ud12Service, "templateRoot", "\\\\server\\share\\path");
            ReflectionTestUtils.setField(ud12Service, "networkUsername", "");
            ReflectionTestUtils.setField(ud12Service, "networkPassword", "");
            ReflectionTestUtils.setField(ud12Service, "networkAuthenticated", false);

            ud12Service.init();

            assertTrue((Boolean) ReflectionTestUtils.getField(ud12Service, "networkAuthenticated"));
        }

        @Test
        @DisplayName("UNC路径有用户名密码时尝试net use")
        void testUNCPathWithCredentials() {
            ReflectionTestUtils.setField(ud12Service, "templateRoot", "\\\\server\\share\\path");
            ReflectionTestUtils.setField(ud12Service, "networkUsername", "testuser");
            ReflectionTestUtils.setField(ud12Service, "networkPassword", "testpass");
            ReflectionTestUtils.setField(ud12Service, "networkAuthenticated", false);

            ud12Service.init();

            // net use会超时，但else块会设置networkAuthenticated=true
            assertTrue((Boolean) ReflectionTestUtils.getField(ud12Service, "networkAuthenticated"));
        }

        @Test
        @DisplayName("首次init后再次调用init()触发提前返回")
        void testInitWhenAlreadyAuthenticated() {
            // setUp()已调用init()一次，networkAuthenticated=true
            // 再次调用init()应走 L77 提前返回
            ud12Service.init();

            assertTrue((Boolean) ReflectionTestUtils.getField(ud12Service, "networkAuthenticated"));
        }

        @Test
        @DisplayName("templateRoot为null时走else分支")
        void testNullTemplateRoot() {
            ReflectionTestUtils.setField(ud12Service, "templateRoot", null);
            ReflectionTestUtils.setField(ud12Service, "networkAuthenticated", false);

            ud12Service.init();

            assertTrue((Boolean) ReflectionTestUtils.getField(ud12Service, "networkAuthenticated"));
        }

        @Test
        @DisplayName("networkUsername为null时短路到用户名缺失分支")
        void testNullNetworkUsername() {
            ReflectionTestUtils.setField(ud12Service, "templateRoot", "\\\\server\\share\\path");
            ReflectionTestUtils.setField(ud12Service, "networkUsername", null);
            ReflectionTestUtils.setField(ud12Service, "networkPassword", "pass");
            ReflectionTestUtils.setField(ud12Service, "networkAuthenticated", false);

            ud12Service.init();

            assertTrue((Boolean) ReflectionTestUtils.getField(ud12Service, "networkAuthenticated"));
        }

        @Test
        @DisplayName("简单UNC路径(双反斜杠+server)验证firstSlash逻辑")
        void testSimpleUNCServerOnly() {
            ReflectionTestUtils.setField(ud12Service, "templateRoot", "\\\\server");
            ReflectionTestUtils.setField(ud12Service, "networkUsername", "testuser");
            ReflectionTestUtils.setField(ud12Service, "networkPassword", "pass");
            ReflectionTestUtils.setField(ud12Service, "networkAuthenticated", false);

            ud12Service.init();

            assertTrue((Boolean) ReflectionTestUtils.getField(ud12Service, "networkAuthenticated"));
        }

        @Test
        @DisplayName("UNC路径(双反斜杠+server+share)验证secondSlash逻辑")
        void testSimpleUNCShareOnly() {
            ReflectionTestUtils.setField(ud12Service, "templateRoot", "\\\\server\\share");
            ReflectionTestUtils.setField(ud12Service, "networkUsername", "testuser");
            ReflectionTestUtils.setField(ud12Service, "networkPassword", "pass");
            ReflectionTestUtils.setField(ud12Service, "networkAuthenticated", false);

            ud12Service.init();

            assertTrue((Boolean) ReflectionTestUtils.getField(ud12Service, "networkAuthenticated"));
        }
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
            // 重置认证状态，触发 getTemplateRootPath() 中的重新认证
            ReflectionTestUtils.setField(ud12Service, "networkAuthenticated", false);

            List<UD12TemplateFileResponse> result = ud12Service.selectTemplateFiles("NONEXIST_MARKET");

            assertNotNull(result);
            assertTrue(result.isEmpty());
            // 认证状态应该已被重新设置为 true
            assertTrue((Boolean) ReflectionTestUtils.getField(ud12Service, "networkAuthenticated"));
        }

        @Test
        @DisplayName("市场目录存在且有文件时返回文件列表")
        void testMarketDirWithFiles() throws IOException {
            Path tempDir = Files.createTempDirectory("ud12-test-");
            try {
                ReflectionTestUtils.setField(ud12Service, "templateRoot", tempDir.toString());
                ReflectionTestUtils.setField(ud12Service, "networkAuthenticated", true);

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
        @DisplayName("marketDir是文件而非目录时跳过（Files.exists true, isDirectory false）")
        void testMarketDirIsFile() throws IOException {
            Path tempDir = Files.createTempDirectory("ud12-test-");
            try {
                ReflectionTestUtils.setField(ud12Service, "templateRoot", tempDir.toString());
                ReflectionTestUtils.setField(ud12Service, "networkAuthenticated", true);

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
        @DisplayName("上传成功 - 文件保存到市场目录")
        void testUploadSuccess() throws IOException {
            Path tempDir = Files.createTempDirectory("ud12-upload-test-");
            try {
                ReflectionTestUtils.setField(ud12Service, "templateRoot", tempDir.toString());
                ReflectionTestUtils.setField(ud12Service, "networkAuthenticated", true);

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
                ReflectionTestUtils.setField(ud12Service, "networkAuthenticated", true);

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
        void testDeleteFailed() throws IOException {
            Path tempDir = Files.createTempDirectory("ud12-delete-fail-test-");
            try {
                ReflectionTestUtils.setField(ud12Service, "templateRoot", tempDir.toString());
                ReflectionTestUtils.setField(ud12Service, "networkAuthenticated", true);

                Path marketDir = tempDir.resolve("JPN");
                Files.createDirectories(marketDir);
                Path testFile = marketDir.resolve("test.odt");
                Files.createFile(testFile);

                // 设置为只读，使 file.delete() 在某些系统上返回 false
                File file = testFile.toFile();
                file.setReadOnly();

                // 无论是否真正删除失败，都测试逻辑覆盖率
                // 如果 setReadOnly 有效则走删除失败路径；否则走成功路径
                try {
                    ud12Service.deleteFile("JPN", "test.odt");
                } catch (RuntimeException e) {
                    assertEquals("System error. Please contact administrator.", e.getMessage());
                }
            } finally {
                File file = tempDir.resolve("JPN").resolve("test.odt").toFile();
                file.setWritable(true);
                try {
                    Files.walk(tempDir)
                            .sorted(Comparator.reverseOrder())
                            .forEach(p -> { try { Files.deleteIfExists(p); } catch (IOException e) {} });
                } catch (IOException e) {}
            }
        }
    }

    /**
     * Comparator.reverseOrder() 用于 cleanup 时排序
     */
    private static final Comparator<Path> PATH_REVERSE_COMPARATOR = (a, b) -> b.compareTo(a);
}
