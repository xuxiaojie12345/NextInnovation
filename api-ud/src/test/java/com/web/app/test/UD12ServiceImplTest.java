package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.MarketMaster;
import com.web.app.mapper.UD12Mapper;
import com.web.app.service.impl.UD12ServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
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
 * 覆盖所有分支路径，达到100%分支覆盖率
 */
@ExtendWith(MockitoExtension.class)
class UD12ServiceImplTest {

    @Mock
    private UD12Mapper ud12Mapper;

    @InjectMocks
    private UD12ServiceImpl service;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() throws Exception {
        // 使用临时目录作为上传目录
        java.lang.reflect.Field field = UD12ServiceImpl.class.getDeclaredField("uploadDir");
        field.setAccessible(true);
        field.set(service, tempDir.toString());
    }

    // ============================================================
    // getMarketList()
    // ============================================================

    @Test
    @DisplayName("getMarketList - 正常返回，应包含market字段")
    void getMarketList_Success_ShouldReturnMarketList() {
        MarketMaster m1 = new MarketMaster();
        m1.setMarket("JP");
        MarketMaster m2 = new MarketMaster();
        m2.setMarket("US");
        when(ud12Mapper.selectMarketMaster()).thenReturn(Arrays.asList(m1, m2));

        ApiResponse<?> result = service.getMarketList();

        assertEquals(200, result.getCode());
        assertEquals("获取市场列表成功", result.getMsg());
        assertNotNull(result.getData());
        List<?> list = (List<?>) result.getData();
        assertEquals(2, list.size());
        assertEquals("JP", ((Map<?, ?>) list.get(0)).get("market"));
        assertEquals("US", ((Map<?, ?>) list.get(1)).get("market"));
    }

    @Test
    @DisplayName("getMarketList - Mapper异常，应返回500")
    void getMarketList_MapperThrowsException_ShouldReturn500() {
        when(ud12Mapper.selectMarketMaster()).thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.getMarketList();

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // getTemplateFiles()
    // ============================================================

    @Test
    @DisplayName("getTemplateFiles - marketCode为null，应返回400")
    void getTemplateFiles_MarketCodeNull_ShouldReturn400() {
        ApiResponse<?> result = service.getTemplateFiles(null);

        assertEquals(400, result.getCode());
        assertEquals("市场代码不能为空", result.getMsg());
    }

    @Test
    @DisplayName("getTemplateFiles - marketCode为空字符串，应返回400")
    void getTemplateFiles_MarketCodeEmpty_ShouldReturn400() {
        ApiResponse<?> result = service.getTemplateFiles("");

        assertEquals(400, result.getCode());
    }

    @Test
    @DisplayName("getTemplateFiles - 市场目录不存在，应返回空列表")
    void getTemplateFiles_DirNotExists_ShouldReturnEmptyList() {
        ApiResponse<?> result = service.getTemplateFiles("NONEXIST");

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertTrue(((List<?>) result.getData()).isEmpty());
    }

    @Test
    @DisplayName("getTemplateFiles - 市场目录存在且有文件，应返回文件列表")
    void getTemplateFiles_DirExistsWithFiles_ShouldReturnFileList() throws Exception {
        File marketDir = new File(tempDir.toFile(), "JP");
        marketDir.mkdirs();
        new File(marketDir, "template1.odt").createNewFile();
        new File(marketDir, "template2.odt").createNewFile();

        ApiResponse<?> result = service.getTemplateFiles("JP");

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        List<?> list = (List<?>) result.getData();
        assertEquals(2, list.size());
        Set<String> fileNames = new HashSet<>();
        fileNames.add((String) ((Map<?, ?>) list.get(0)).get("fileName"));
        fileNames.add((String) ((Map<?, ?>) list.get(1)).get("fileName"));
        assertTrue(fileNames.contains("template1.odt"));
        assertTrue(fileNames.contains("template2.odt"));
    }

    @Test
    @DisplayName("getTemplateFiles - 市场目录存在但无文件，应返回空列表")
    void getTemplateFiles_DirExistsNoFiles_ShouldReturnEmptyList() throws Exception {
        File marketDir = new File(tempDir.toFile(), "JP");
        marketDir.mkdirs();

        ApiResponse<?> result = service.getTemplateFiles("JP");

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertTrue(((List<?>) result.getData()).isEmpty());
    }

    @Test
    @DisplayName("getTemplateFiles - marketCode路径存在但不是一个目录（是文件），应返回空列表")
    void getTemplateFiles_PathIsFileNotDir_ShouldReturnEmptyList() throws Exception {
        // 创建一个与市场代码同名的文件而非目录
        File fileInsteadOfDir = new File(tempDir.toFile(), "FILE_MARKET");
        fileInsteadOfDir.createNewFile();

        ApiResponse<?> result = service.getTemplateFiles("FILE_MARKET");

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertTrue(((List<?>) result.getData()).isEmpty());
    }

    // ============================================================
    // uploadFile()
    // ============================================================

    @Test
    @DisplayName("uploadFile - file为null，应返回400")
    void uploadFile_FileNull_ShouldReturn400() {
        ApiResponse<?> result = service.uploadFile(null, "JP");

        assertEquals(400, result.getCode());
        assertEquals("请选择要上传的文件", result.getMsg());
    }

    @Test
    @DisplayName("uploadFile - file为空，应返回400")
    void uploadFile_FileEmpty_ShouldReturn400() {
        MultipartFile emptyFile = new MockMultipartFile("file", "test.txt", "text/plain", new byte[0]);

        ApiResponse<?> result = service.uploadFile(emptyFile, "JP");

        assertEquals(400, result.getCode());
    }

    @Test
    @DisplayName("uploadFile - market为null，应返回400")
    void uploadFile_MarketNull_ShouldReturn400() {
        MultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());

        ApiResponse<?> result = service.uploadFile(file, null);

        assertEquals(400, result.getCode());
        assertEquals("市场代码不能为空", result.getMsg());
    }

    @Test
    @DisplayName("uploadFile - market为空字符串，应返回400")
    void uploadFile_MarketEmpty_ShouldReturn400() {
        MultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());

        ApiResponse<?> result = service.uploadFile(file, "");

        assertEquals(400, result.getCode());
    }

    @Test
    @DisplayName("uploadFile - originalFilename为null，应返回400")
    void uploadFile_OriginalFilenameNull_ShouldReturn400() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn(null);

        ApiResponse<?> result = service.uploadFile(file, "JP");

        assertEquals(400, result.getCode());
        assertEquals("文件名不能为空", result.getMsg());
    }

    @Test
    @DisplayName("uploadFile - originalFilename为空字符串，应返回400")
    void uploadFile_OriginalFilenameEmpty_ShouldReturn400() {
        MultipartFile file = new MockMultipartFile("file", "", "text/plain", "content".getBytes());

        ApiResponse<?> result = service.uploadFile(file, "JP");

        assertEquals(400, result.getCode());
    }

    @Test
    @DisplayName("uploadFile - 文件超过50MB，应返回400")
    void uploadFile_FileTooLarge_ShouldReturn400() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("large.txt");
        when(file.getSize()).thenReturn(51L * 1024 * 1024);

        ApiResponse<?> result = service.uploadFile(file, "JP");

        assertEquals(400, result.getCode());
        assertEquals("文件大小不能超过50MB", result.getMsg());
    }

    @Test
    @DisplayName("uploadFile - 上传成功，市场目录不存在则自动创建")
    void uploadFile_Success_DirNotExists_ShouldCreateDirAndUpload() throws Exception {
        byte[] content = "template content".getBytes();
        MultipartFile file = new MockMultipartFile("file", "mytemplate.odt", "application/octet-stream", content);
        // 目录尚不存在，uploadFile内部应创建

        ApiResponse<?> result = service.uploadFile(file, "JP");

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        Map<?, ?> data = (Map<?, ?>) result.getData();
        assertEquals("mytemplate.odt", data.get("fileName"));
        assertTrue((Boolean) data.get("success"));

        // 验证文件确实已写入
        File uploaded = new File(tempDir.toFile(), "JP/mytemplate.odt");
        assertTrue(uploaded.exists());
        assertArrayEquals(content, Files.readAllBytes(uploaded.toPath()));
    }

    @Test
    @DisplayName("uploadFile - 上传成功，市场目录已存在")
    void uploadFile_Success_DirAlreadyExists_ShouldUpload() throws Exception {
        // 先创建市场目录
        new File(tempDir.toFile(), "EXISTING_MARKET").mkdirs();
        byte[] content = "data".getBytes();
        MultipartFile file = new MockMultipartFile("file", "existing.odt", "application/octet-stream", content);

        ApiResponse<?> result = service.uploadFile(file, "EXISTING_MARKET");

        assertEquals(200, result.getCode());
        File uploaded = new File(tempDir.toFile(), "EXISTING_MARKET/existing.odt");
        assertTrue(uploaded.exists());
    }

    @Test
    @DisplayName("uploadFile - IOException，应返回500")
    void uploadFile_IOException_ShouldReturn500() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("test.txt");
        when(file.getSize()).thenReturn(100L);
        doThrow(new IOException("Disk full")).when(file).transferTo(any(File.class));

        ApiResponse<?> result = service.uploadFile(file, "JP");

        assertEquals(500, result.getCode());
        assertTrue(result.getMsg().contains("文件上传失败"));
    }

    // ============================================================
    // deleteFile()
    // ============================================================

    @Test
    @DisplayName("deleteFile - market为null，应返回400")
    void deleteFile_MarketNull_ShouldReturn400() {
        ApiResponse<?> result = service.deleteFile(null, "test.txt");

        assertEquals(400, result.getCode());
        assertEquals("市场代码不能为空", result.getMsg());
    }

    @Test
    @DisplayName("deleteFile - market为空字符串，应返回400")
    void deleteFile_MarketEmpty_ShouldReturn400() {
        ApiResponse<?> result = service.deleteFile("", "test.txt");

        assertEquals(400, result.getCode());
    }

    @Test
    @DisplayName("deleteFile - fileName为null，应返回400")
    void deleteFile_FileNameNull_ShouldReturn400() {
        ApiResponse<?> result = service.deleteFile("JP", null);

        assertEquals(400, result.getCode());
        assertEquals("文件名不能为空", result.getMsg());
    }

    @Test
    @DisplayName("deleteFile - fileName为空字符串，应返回400")
    void deleteFile_FileNameEmpty_ShouldReturn400() {
        ApiResponse<?> result = service.deleteFile("JP", "");

        assertEquals(400, result.getCode());
    }

    @Test
    @DisplayName("deleteFile - 文件不存在，应返回400")
    void deleteFile_FileNotExists_ShouldReturn400() {
        ApiResponse<?> result = service.deleteFile("JP", "nonexistent.txt");

        assertEquals(400, result.getCode());
        assertEquals("文件不存在", result.getMsg());
    }

    @Test
    @DisplayName("deleteFile - 路径不是文件，应返回400")
    void deleteFile_PathIsNotFile_ShouldReturn400() throws Exception {
        // 创建一个目录而不是文件
        File marketDir = new File(tempDir.toFile(), "JP");
        marketDir.mkdirs();
        File dirFile = new File(marketDir, "subdir");
        dirFile.mkdirs();

        ApiResponse<?> result = service.deleteFile("JP", "subdir");

        assertEquals(400, result.getCode());
        assertEquals("路径不是文件", result.getMsg());
    }

    @Test
    @DisplayName("deleteFile - 删除文件失败（delete返回false），应返回500")
    void deleteFile_DeleteFails_ShouldReturn500() throws Exception {
        File marketDir = new File(tempDir.toFile(), "DELETE_FAIL");
        marketDir.mkdirs();
        File targetFile = new File(marketDir, "locked.txt");
        targetFile.createNewFile();
        // 利用try-with-resources锁住文件，使delete()返回false
        try (java.io.RandomAccessFile lock = new java.io.RandomAccessFile(targetFile, "rw");
             java.nio.channels.FileChannel channel = lock.getChannel()) {
            java.nio.channels.FileLock fileLock = channel.lock();
            try {
                ApiResponse<?> result = service.deleteFile("DELETE_FAIL", "locked.txt");
                assertEquals(500, result.getCode());
                assertEquals("文件删除失败", result.getMsg());
            } finally {
                fileLock.release();
            }
        }
    }

    @Test
    @DisplayName("deleteFile - 删除成功，应返回成功")
    void deleteFile_Success_ShouldReturnSuccess() throws Exception {
        File marketDir = new File(tempDir.toFile(), "JP");
        marketDir.mkdirs();
        File targetFile = new File(marketDir, "delete_me.txt");
        targetFile.createNewFile();

        ApiResponse<?> result = service.deleteFile("JP", "delete_me.txt");

        assertEquals(200, result.getCode());
        assertEquals("删除成功", result.getMsg());
        assertNotNull(result.getData());
        Map<?, ?> data = (Map<?, ?>) result.getData();
        assertEquals("delete_me.txt", data.get("fileName"));
        assertEquals("JP", data.get("market"));
        assertTrue((Boolean) data.get("success"));
        assertFalse(targetFile.exists());
    }

    // ============================================================
    // downloadFile()
    // ============================================================

    @Test
    @DisplayName("downloadFile - 文件不存在，应返回null")
    void downloadFile_FileNotExists_ShouldReturnNull() {
        Resource result = service.downloadFile("JP", "nonexistent.txt");

        assertNull(result);
    }

    @Test
    @DisplayName("downloadFile - 文件存在，应返回Resource")
    void downloadFile_FileExists_ShouldReturnResource() throws Exception {
        File marketDir = new File(tempDir.toFile(), "JP");
        marketDir.mkdirs();
        File targetFile = new File(marketDir, "download.txt");
        targetFile.createNewFile();

        Resource result = service.downloadFile("JP", "download.txt");

        assertNotNull(result);
        assertTrue(result.exists());
        assertEquals("download.txt", result.getFilename());
    }

    @Test
    @DisplayName("downloadFile - 路径存在但不是文件（是目录），应返回null")
    void downloadFile_PathIsDirectory_ShouldReturnNull() throws Exception {
        File marketDir = new File(tempDir.toFile(), "JP");
        marketDir.mkdirs();
        // 以一个目录路径作为文件名
        File subDir = new File(marketDir, "subdir");
        subDir.mkdirs();

        Resource result = service.downloadFile("JP", "subdir");

        assertNull(result);
    }

    // ============================================================
    // getUploadDir()
    // ============================================================

    @Test
    @DisplayName("getUploadDir - 应返回上传目录路径")
    void getUploadDir_ShouldReturnUploadDir() {
        String result = service.getUploadDir();

        assertEquals(tempDir.toString(), result);
    }
}
