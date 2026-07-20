package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.MarketMaster;
import com.web.app.mapper.UD14Mapper;
import com.web.app.service.impl.UD14ServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.File;
import java.nio.file.Path;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD14ServiceImpl 单元测试
 * 覆盖所有分支路径，达到100%分支覆盖率
 */
@ExtendWith(MockitoExtension.class)
class UD14ServiceImplTest {

    @Mock
    private UD14Mapper ud14Mapper;

    @InjectMocks
    private UD14ServiceImpl service;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() throws Exception {
        java.lang.reflect.Field field = UD14ServiceImpl.class.getDeclaredField("uploadDir");
        field.setAccessible(true);
        field.set(service, tempDir.toString());
    }

    // ============================================================
    // getMarkets()
    // ============================================================

    @Test
    @DisplayName("getMarkets - 正常返回市场列表")
    void getMarkets_Success_ShouldReturnMarketList() {
        MarketMaster m1 = new MarketMaster();
        m1.setMarket("JP");
        MarketMaster m2 = new MarketMaster();
        m2.setMarket("US");
        when(ud14Mapper.selectMarketMaster()).thenReturn(Arrays.asList(m1, m2));

        ApiResponse<?> result = service.getMarkets();

        assertEquals(200, result.getCode());
        assertEquals("获取市场列表成功", result.getMsg());
        assertNotNull(result.getData());
        List<?> list = (List<?>) result.getData();
        assertEquals(2, list.size());
        assertEquals("JP", ((Map<?, ?>) list.get(0)).get("market"));
        assertEquals("US", ((Map<?, ?>) list.get(1)).get("market"));
    }

    @Test
    @DisplayName("getMarkets - Mapper返回null，应返回空列表")
    void getMarkets_MapperReturnsNull_ShouldReturnEmptyList() {
        when(ud14Mapper.selectMarketMaster()).thenReturn(null);

        ApiResponse<?> result = service.getMarkets();

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertTrue(((List<?>) result.getData()).isEmpty());
    }

    @Test
    @DisplayName("getMarkets - Mapper异常，应返回500")
    void getMarkets_MapperThrowsException_ShouldReturn500() {
        when(ud14Mapper.selectMarketMaster()).thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.getMarkets();

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // getVariablesByMarket() — 参数校验
    // ============================================================

    @Test
    @DisplayName("getVariablesByMarket - market为null，应返回400")
    void getVariablesByMarket_MarketNull_ShouldReturn400() {
        ApiResponse<?> result = service.getVariablesByMarket(null);

        assertEquals(400, result.getCode());
        assertEquals("市场代码不能为空", result.getMsg());
        verifyNoInteractions(ud14Mapper);
    }

    @Test
    @DisplayName("getVariablesByMarket - market为空字符串，应返回400")
    void getVariablesByMarket_MarketEmpty_ShouldReturn400() {
        ApiResponse<?> result = service.getVariablesByMarket("");

        assertEquals(400, result.getCode());
        verifyNoInteractions(ud14Mapper);
    }

    @Test
    @DisplayName("getVariablesByMarket - market为空白字符串，应返回400")
    void getVariablesByMarket_MarketBlank_ShouldReturn400() {
        ApiResponse<?> result = service.getVariablesByMarket("   ");

        assertEquals(400, result.getCode());
        assertEquals("市场代码不能为空", result.getMsg());
        verifyNoInteractions(ud14Mapper);
    }

    // ============================================================
    // getVariablesByMarket() — 文件目录不存在
    // ============================================================

    @Test
    @DisplayName("getVariablesByMarket - 市场目录不存在，应返回空列表")
    void getVariablesByMarket_DirNotExists_ShouldReturnEmptyList() {
        ApiResponse<?> result = service.getVariablesByMarket("NONEXIST");

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertTrue(((List<?>) result.getData()).isEmpty());
        verifyNoInteractions(ud14Mapper);
    }

    @Test
    @DisplayName("getVariablesByMarket - 市场路径存在但不是目录（是文件），应返回空列表")
    void getVariablesByMarket_PathIsFileNotDir_ShouldReturnEmptyList() throws Exception {
        File fileInsteadOfDir = new File(tempDir.toFile(), "FILE_MARKET");
        fileInsteadOfDir.createNewFile();

        ApiResponse<?> result = service.getVariablesByMarket("FILE_MARKET");

        assertEquals(200, result.getCode());
        assertTrue(((List<?>) result.getData()).isEmpty());
        verifyNoInteractions(ud14Mapper);
    }

    // ============================================================
    // getVariablesByMarket() — 目录存在，文件列表处理
    // ============================================================

    @Test
    @DisplayName("getVariablesByMarket - 目录存在且无文件，应返回空列表")
    void getVariablesByMarket_DirExistsNoFiles_ShouldReturnEmptyList() throws Exception {
        new File(tempDir.toFile(), "JP").mkdirs();

        ApiResponse<?> result = service.getVariablesByMarket("JP");

        assertEquals(200, result.getCode());
        assertTrue(((List<?>) result.getData()).isEmpty());
        verifyNoInteractions(ud14Mapper);
    }

    @Test
    @DisplayName("getVariablesByMarket - 目录存在且有文件但variables为null，used应为空字符串")
    void getVariablesByMarket_FileExistsVariablesNull_ShouldReturnEmptyUsed() throws Exception {
        File marketDir = new File(tempDir.toFile(), "JP");
        marketDir.mkdirs();
        new File(marketDir, "test.odt").createNewFile();
        when(ud14Mapper.selectVariablesByVal("JP", "JP/test.odt")).thenReturn(null);

        ApiResponse<?> result = service.getVariablesByMarket("JP");

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        List<?> list = (List<?>) result.getData();
        assertEquals(1, list.size());
        Map<?, ?> fileInfo = (Map<?, ?>) list.get(0);
        assertEquals("test.odt", fileInfo.get("filename"));
        assertEquals("", fileInfo.get("used"));
        assertNotNull(fileInfo.get("lastMod"));
        assertNotNull(fileInfo.get("size"));
    }

    @Test
    @DisplayName("getVariablesByMarket - 目录存在且有文件但variables为空列表，used应为空字符串")
    void getVariablesByMarket_FileExistsVariablesEmpty_ShouldReturnEmptyUsed() throws Exception {
        File marketDir = new File(tempDir.toFile(), "JP");
        marketDir.mkdirs();
        new File(marketDir, "test.odt").createNewFile();
        when(ud14Mapper.selectVariablesByVal("JP", "JP/test.odt")).thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.getVariablesByMarket("JP");

        assertEquals(200, result.getCode());
        List<?> list = (List<?>) result.getData();
        assertEquals(1, list.size());
        assertEquals("", ((Map<?, ?>) list.get(0)).get("used"));
    }

    @Test
    @DisplayName("getVariablesByMarket - 目录存在且有文件且variables非空，used应包含变量名")
    void getVariablesByMarket_FileExistsVariablesNotEmpty_ShouldReturnUsed() throws Exception {
        File marketDir = new File(tempDir.toFile(), "JP");
        marketDir.mkdirs();
        new File(marketDir, "test.odt").createNewFile();
        when(ud14Mapper.selectVariablesByVal("JP", "JP/test.odt")).thenReturn(Arrays.asList("VAR001", "VAR002"));

        ApiResponse<?> result = service.getVariablesByMarket("JP");

        assertEquals(200, result.getCode());
        List<?> list = (List<?>) result.getData();
        assertEquals(1, list.size());
        assertEquals("VAR001 VAR002", ((Map<?, ?>) list.get(0)).get("used"));
    }

    @Test
    @DisplayName("getVariablesByMarket - 多个文件，应返回多个文件信息")
    void getVariablesByMarket_MultipleFiles_ShouldReturnAllFiles() throws Exception {
        File marketDir = new File(tempDir.toFile(), "JP");
        marketDir.mkdirs();
        new File(marketDir, "a.odt").createNewFile();
        new File(marketDir, "b.odt").createNewFile();
        when(ud14Mapper.selectVariablesByVal(eq("JP"), anyString())).thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.getVariablesByMarket("JP");

        assertEquals(200, result.getCode());
        List<?> list = (List<?>) result.getData();
        assertEquals(2, list.size());
        verify(ud14Mapper, times(2)).selectVariablesByVal(eq("JP"), anyString());
    }

    @Test
    @DisplayName("getVariablesByMarket - Mapper异常，应返回500")
    void getVariablesByMarket_MapperThrowsException_ShouldReturn500() throws Exception {
        File marketDir = new File(tempDir.toFile(), "JP");
        marketDir.mkdirs();
        new File(marketDir, "test.odt").createNewFile();
        when(ud14Mapper.selectVariablesByVal("JP", "JP/test.odt"))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.getVariablesByMarket("JP");

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // formatFileSize() — 通过文件大小间接测试
    // ============================================================

    @Test
    @DisplayName("getVariablesByMarket - 文件大小格式化测试（小于1KB）")
    void formatFileSize_LessThan1KB_ShouldReturnBytes() throws Exception {
        File marketDir = new File(tempDir.toFile(), "SZ");
        marketDir.mkdirs();
        // 创建500字节的文件
        java.nio.file.Files.write(new File(marketDir, "small.txt").toPath(), new byte[500]);

        ApiResponse<?> result = service.getVariablesByMarket("SZ");

        assertEquals(200, result.getCode());
        List<?> list = (List<?>) result.getData();
        assertEquals("500 B", ((Map<?, ?>) list.get(0)).get("size"));
    }

    @Test
    @DisplayName("getVariablesByMarket - 文件大小格式化测试（1KB~1MB）")
    void formatFileSize_Between1KBAnd1MB_ShouldReturnKB() throws Exception {
        File marketDir = new File(tempDir.toFile(), "SZ");
        marketDir.mkdirs();
        // 创建50KB的文件
        java.nio.file.Files.write(new File(marketDir, "med.txt").toPath(), new byte[50 * 1024]);

        ApiResponse<?> result = service.getVariablesByMarket("SZ");

        assertEquals(200, result.getCode());
        List<?> list = (List<?>) result.getData();
        assertTrue(((String) ((Map<?, ?>) list.get(0)).get("size")).endsWith(" KB"));
    }

    @Test
    @DisplayName("getVariablesByMarket - 文件大小格式化测试（大于1MB）")
    void formatFileSize_GreaterThan1MB_ShouldReturnMB() throws Exception {
        File marketDir = new File(tempDir.toFile(), "SZ");
        marketDir.mkdirs();
        // 创建2MB的文件
        java.nio.file.Files.write(new File(marketDir, "large.txt").toPath(), new byte[2 * 1024 * 1024]);

        ApiResponse<?> result = service.getVariablesByMarket("SZ");

        assertEquals(200, result.getCode());
        List<?> list = (List<?>) result.getData();
        assertTrue(((String) ((Map<?, ?>) list.get(0)).get("size")).endsWith(" MB"));
    }
}
