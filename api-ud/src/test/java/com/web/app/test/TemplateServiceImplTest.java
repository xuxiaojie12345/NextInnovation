package com.web.app.test;

import com.web.app.mapper.MarketMasterMapper;
import com.web.app.service.impl.TemplateServiceImpl;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TemplateServiceImpl Unit Tests")
class TemplateServiceImplTest {

    @Mock private MarketMasterMapper marketMasterMapper;
    @InjectMocks private TemplateServiceImpl service;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() throws Exception {
        Field field = TemplateServiceImpl.class.getDeclaredField("uploadDir");
        field.setAccessible(true);
        field.set(service, tempDir.toString());
    }

    @Test void shouldSelectAllMarkets() {
        when(marketMasterMapper.selectAllMarketCodes()).thenReturn(Arrays.asList("JP"));
        assertEquals(1, service.selectAllMarkets().size());
    }

    @Nested @DisplayName("listTemplates()")
    class ListTemplates {
        @Test void shouldReturnFilesInMarketDirectory() throws Exception {
            Path marketDir = tempDir.resolve("JP");
            marketDir.toFile().mkdirs();
            Files.createFile(marketDir.resolve("template1.txt"));
            Files.createFile(marketDir.resolve("template2.docx"));
            List<Map<String, Object>> result = service.listTemplates("JP");
            assertEquals(2, result.size());
            Set<String> filenames = result.stream()
                .map(m -> (String) m.get("filename"))
                .collect(java.util.stream.Collectors.toSet());
            assertTrue(filenames.contains("template1.txt"));
            assertTrue(filenames.contains("template2.docx"));
        }

        @Test void shouldReturnEmptyWhenDirectoryNotExists() {
            List<Map<String, Object>> result = service.listTemplates("NONEXISTENT");
            assertTrue(result.isEmpty());
        }

        @Test void shouldReturnEmptyWhenNoFiles() {
            Path marketDir = tempDir.resolve("JP");
            marketDir.toFile().mkdirs();
            List<Map<String, Object>> result = service.listTemplates("JP");
            assertTrue(result.isEmpty());
        }

        @Test void shouldIncludeFileInfo() throws Exception {
            Path marketDir = tempDir.resolve("JP");
            marketDir.toFile().mkdirs();
            Files.createFile(marketDir.resolve("test.txt"));
            List<Map<String, Object>> result = service.listTemplates("JP");
            assertEquals(1, result.size());
            Map<String, Object> info = result.get(0);
            assertEquals("test.txt", info.get("filename"));
            assertNotNull(info.get("lastMod"));
            assertNotNull(info.get("size"));
        }
    }

    @Nested @DisplayName("uploadFile()")
    class UploadFile {
        @Test void shouldUploadFile() throws Exception {
            MultipartFile file = mock(MultipartFile.class);
            when(file.getOriginalFilename()).thenReturn("template.txt");
            doAnswer(invocation -> {
                File dest = invocation.getArgument(0);
                dest.getParentFile().mkdirs();
                dest.createNewFile();
                return null;
            }).when(file).transferTo(any(File.class));
            service.uploadFile(file, "JP");
            assertTrue(Files.exists(tempDir.resolve("JP/template.txt")));
        }

        @Test void shouldCreateMarketDirIfNotExists() throws Exception {
            MultipartFile file = mock(MultipartFile.class);
            when(file.getOriginalFilename()).thenReturn("template.txt");
            doAnswer(invocation -> {
                File dest = invocation.getArgument(0);
                dest.getParentFile().mkdirs();
                dest.createNewFile();
                return null;
            }).when(file).transferTo(any(File.class));
            service.uploadFile(file, "NEW_MARKET");
            assertTrue(Files.exists(tempDir.resolve("NEW_MARKET/template.txt")));
        }

        @Test void shouldNotCreateDirWhenAlreadyExists() throws Exception {
            // Pre-create the market directory so !dir.exists() is false
            tempDir.resolve("JP").toFile().mkdirs();
            MultipartFile file = mock(MultipartFile.class);
            when(file.getOriginalFilename()).thenReturn("template.txt");
            doAnswer(invocation -> {
                File dest = invocation.getArgument(0);
                dest.createNewFile();
                return null;
            }).when(file).transferTo(any(File.class));
            String result = service.uploadFile(file, "JP");
            assertTrue(result.contains("SUCCESSFULLY UPLOADED"));
            assertTrue(Files.exists(tempDir.resolve("JP/template.txt")));
        }

        @Test void shouldThrowWhenTransferFails() throws Exception {
            MultipartFile file = mock(MultipartFile.class);
            when(file.getOriginalFilename()).thenReturn("template.txt");
            doThrow(new IOException("Disk full")).when(file).transferTo(any(File.class));
            RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.uploadFile(file, "JP"));
            assertTrue(ex.getMessage().contains("File upload failed"));
        }
    }

    @Nested @DisplayName("deleteFile()")
    class DeleteFile {
        @Test void shouldDeleteFile() {
            Path marketDir = tempDir.resolve("JP");
            marketDir.toFile().mkdirs();
            Path filePath = marketDir.resolve("template.txt");
            assertDoesNotThrow(() -> Files.createFile(filePath));
            assertTrue(Files.exists(filePath));
            String result = service.deleteFile("template.txt", "JP");
            assertTrue(result.contains("SUCCESSFULLY DELETED"));
            assertFalse(Files.exists(filePath));
        }

        @Test void shouldThrowWhenFileNotFound() {
            RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.deleteFile("nonexistent.txt", "JP"));
            assertTrue(ex.getMessage().contains("File not found"));
        }

        @Test void shouldThrowWhenFileLocked() throws Exception {
            Path marketDir = tempDir.resolve("JP");
            marketDir.toFile().mkdirs();
            Path filePath = marketDir.resolve("locked.txt");
            Files.createFile(filePath);
            // Keep a FileInputStream open to lock the file on Windows,
            // so Files.delete() throws IOException
            FileInputStream fis = new FileInputStream(filePath.toFile());
            try {
                RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> service.deleteFile("locked.txt", "JP"));
                assertTrue(ex.getMessage().contains("File deletion failed"));
            } finally {
                fis.close();
            }
        }
    }

    @Nested @DisplayName("downloadFile()")
    class DownloadFile {
        @Test void shouldDownloadFile() throws Exception {
            Path marketDir = tempDir.resolve("JP");
            marketDir.toFile().mkdirs();
            Path filePath = marketDir.resolve("template.txt");
            Files.createFile(filePath);
            Resource resource = service.downloadFile("template.txt", "JP");
            assertTrue(resource instanceof FileSystemResource);
            assertTrue(resource.exists());
        }

        @Test void shouldThrowWhenFileNotFound() {
            RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.downloadFile("nonexistent.txt", "JP"));
            assertTrue(ex.getMessage().contains("File not found"));
        }
    }

    @Nested @DisplayName("pathTraversalProtection()")
    class PathTraversalProtection {
        @ParameterizedTest
        @ValueSource(strings = {
            "../../etc/passwd",
            "..\\..\\windows\\system32\\config",
            "../other/dir/file.txt",
            "/absolute/path/file.txt",
            "\\absolute\\path\\file.txt",
            "sub/../../outside",
            "~user/file.txt"
        })
        void shouldRejectPathTraversalInFileName(String maliciousName) {
            RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.downloadFile(maliciousName, "JP"));
            assertTrue(ex.getMessage().contains("path traversal"),
                "Should reject: " + maliciousName);
        }

        @ParameterizedTest
        @ValueSource(strings = {
            "../../etc",
            "..\\..\\windows",
            "../other",
            "/absolute/path",
            "\\absolute\\path",
            "~other"
        })
        void shouldRejectPathTraversalInMarket(String maliciousMarket) {
            RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.listTemplates(maliciousMarket));
            assertTrue(ex.getMessage().contains("path traversal"),
                "Should reject: " + maliciousMarket);
        }

        @Test void shouldRejectPathTraversalInUpload() {
            MultipartFile file = mock(MultipartFile.class);
            when(file.getOriginalFilename()).thenReturn("../../malicious.txt");
            RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.uploadFile(file, "JP"));
            assertTrue(ex.getMessage().contains("path traversal"));
        }

        @Test void shouldRejectPathTraversalInDelete() {
            RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.deleteFile("../../../etc/passwd", "JP"));
            assertTrue(ex.getMessage().contains("path traversal"));
        }

        @Test void shouldAllowNormalFilenames() throws Exception {
            Path marketDir = tempDir.resolve("JP");
            marketDir.toFile().mkdirs();
            Files.createFile(marketDir.resolve("normal-file_2024.txt"));
            List<Map<String, Object>> result = service.listTemplates("JP");
            assertEquals(1, result.size());
        }

        @Test void shouldAllowDotInFilename() throws Exception {
            Path marketDir = tempDir.resolve("JP");
            marketDir.toFile().mkdirs();
            Files.createFile(marketDir.resolve("file.v2.final.txt"));
            List<Map<String, Object>> result = service.listTemplates("JP");
            assertEquals(1, result.size());
        }
    }

    @Nested @DisplayName("authenticateShare()")
    class AuthenticateShare {
        @Test void shouldHandleUncPath() throws Exception {
            Field field = TemplateServiceImpl.class.getDeclaredField("uploadDir");
            field.setAccessible(true);
            field.set(service, "//testhost/share");
            // authenticateShare() enters the if block (uploadDir starts with "//"),
            // Runtime.exec runs net use (may fail silently, caught by catch(Exception))
            MultipartFile file = mock(MultipartFile.class);
            when(file.getOriginalFilename()).thenReturn("test.txt");
            doNothing().when(file).transferTo(any(File.class));
            String result = service.uploadFile(file, "JP");
            assertTrue(result.contains("SUCCESSFULLY UPLOADED"));
        }

        @Test void shouldHandleUncPathWithoutSubpath() throws Exception {
            Field field = TemplateServiceImpl.class.getDeclaredField("uploadDir");
            field.setAccessible(true);
            field.set(service, "//");
            // With uploadDir = "//", idx will be -1 (no backslash found after pos 2)
            // so idx > 0 is false — covers the else branch of authenticateShare()
            MultipartFile file = mock(MultipartFile.class);
            when(file.getOriginalFilename()).thenReturn("test.txt");
            doNothing().when(file).transferTo(any(File.class));
            String result = service.uploadFile(file, "JP");
            assertTrue(result.contains("SUCCESSFULLY UPLOADED"));
        }

        @Test void shouldHandleBackslashUncPath() throws Exception {
            Field field = TemplateServiceImpl.class.getDeclaredField("uploadDir");
            field.setAccessible(true);
            // Test the uploadDir.startsWith("\\") branch with double-backslash prefix
            field.set(service, "\\\\testhost\\share");
            MultipartFile file = mock(MultipartFile.class);
            when(file.getOriginalFilename()).thenReturn("test.txt");
            doNothing().when(file).transferTo(any(File.class));
            String result = service.uploadFile(file, "JP");
            assertTrue(result.contains("SUCCESSFULLY UPLOADED"));
        }

        @Test void shouldHandleAuthFailure() throws Exception {
            Field field = TemplateServiceImpl.class.getDeclaredField("uploadDir");
            field.setAccessible(true);
            field.set(service, "//testhost/share");
            // Interrupt current thread so process.waitFor() throws InterruptedException,
            // covering the catch (Exception e) block in authenticateShare()
            Thread.currentThread().interrupt();
            try {
                MultipartFile file = mock(MultipartFile.class);
                when(file.getOriginalFilename()).thenReturn("test.txt");
                doNothing().when(file).transferTo(any(File.class));
                String result = service.uploadFile(file, "JP");
                assertTrue(result.contains("SUCCESSFULLY UPLOADED"));
            } finally {
                // Clear the interrupt flag to avoid affecting other tests
                Thread.interrupted();
            }
        }

        @Test void shouldHandleNonUncPath() throws Exception {
            // uploadDir is already set to tempDir via @BeforeEach (normal local path)
            // authenticateShare() should skip the if block entirely
            Path marketDir = tempDir.resolve("JP");
            marketDir.toFile().mkdirs();
            Path filePath = marketDir.resolve("template.txt");
            Files.createFile(filePath);
            Resource resource = service.downloadFile("template.txt", "JP");
            assertTrue(resource.exists());
        }
    }
}
