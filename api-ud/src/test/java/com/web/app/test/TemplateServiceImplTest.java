package com.web.app.test;

import com.web.app.mapper.MarketMasterMapper;
import com.web.app.service.impl.TemplateServiceImpl;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
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
}
