package com.web.app.test;

import com.web.app.dto.UD14SearchresultistRequest;
import com.web.app.dto.UD14SearchresultistResponse;
import com.web.app.entity.MarketMaster;
import com.web.app.mapper.UD14SearchresultistMapper;
import com.web.app.service.impl.UD14SearchresultistServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD14SearchresultistServiceImpl 单元测试
 * 覆盖所有方法的所有分支，达到 100% JaCoCo 覆盖率
 *
 * 分支统计：
 * - UD14SelectMarketmaster: 3 分支
 * - UD14SelectHdocuserdefinedrules: 7 分支（market null/empty, variableList
 * null/empty/success/Exception）
 * - getMarketFiles: 7 分支（market null/empty, dir not exist, files not null,
 * variable used/unused, Exception）
 * - formatFileSize: 5 分支（<=0, B, KB, MB, GB 理论）
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD14SearchresultistServiceImpl 单元测试")
class UD14SearchresultistServiceImplTest {

    @Mock
    private UD14SearchresultistMapper ud14Mapper;

    @InjectMocks
    private UD14SearchresultistServiceImpl service;

    @TempDir
    Path tempDir;

    private String marketFolderPath;

    @BeforeEach
    void setUp() {
        marketFolderPath = tempDir.toAbsolutePath().toString();
        ReflectionTestUtils.setField(service, "marketFolder", marketFolderPath);
        ReflectionTestUtils.setField(service, "fileServerUsername", "testuser");
        ReflectionTestUtils.setField(service, "fileServerPassword", "testpass");
    }

    /** 设置已认证状态并返回 marketFolderPath */
    private String withAuth() {
        ReflectionTestUtils.setField(service, "authenticated", true);
        return marketFolderPath;
    }

    // ====================================================================
    // UD14SelectMarketmaster 测试
    // ====================================================================

    @Test
    @DisplayName("[SelectMarketmaster] list 不为 null 时应返回市场列表")
    void testSelectMarketmaster_ListNotNull() {
        MarketMaster mm1 = new MarketMaster();
        mm1.setMarket("JP");
        MarketMaster mm2 = new MarketMaster();
        mm2.setMarket("AUS");
        when(ud14Mapper.selectAllMarket()).thenReturn(Arrays.asList(mm1, mm2));

        UD14SearchresultistResponse response = service.UD14SelectMarketmaster();

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());
        @SuppressWarnings("unchecked")
        List<UD14SearchresultistResponse.MarketData> dataList = (List<UD14SearchresultistResponse.MarketData>) response
                .getData();
        assertEquals(2, dataList.size());
        assertEquals("JP", dataList.get(0).getMarket());
        assertEquals("AUS", dataList.get(1).getMarket());
        verify(ud14Mapper, times(1)).selectAllMarket();
    }

    @Test
    @DisplayName("[SelectMarketmaster] list 为 null 时应返回空列表")
    void testSelectMarketmaster_ListNull() {
        when(ud14Mapper.selectAllMarket()).thenReturn(null);

        UD14SearchresultistResponse response = service.UD14SelectMarketmaster();

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());
        @SuppressWarnings("unchecked")
        List<UD14SearchresultistResponse.MarketData> dataList = (List<UD14SearchresultistResponse.MarketData>) response
                .getData();
        assertTrue(dataList.isEmpty());
        verify(ud14Mapper, times(1)).selectAllMarket();
    }

    @Test
    @DisplayName("[SelectMarketmaster] 系统异常时应返回500")
    void testSelectMarketmaster_Exception() {
        when(ud14Mapper.selectAllMarket()).thenThrow(new RuntimeException("数据库异常"));

        UD14SearchresultistResponse response = service.UD14SelectMarketmaster();

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
        verify(ud14Mapper, times(1)).selectAllMarket();
    }

    // ====================================================================
    // UD14SelectHdocuserdefinedrules 测试
    // ====================================================================

    @Test
    @DisplayName("[SelectHdocuserdefinedrules] market 为 null 时应返回400")
    void testSelectHdocuserdefinedrules_MarketNull() {
        UD14SearchresultistResponse response = service
                .UD14SelectHdocuserdefinedrules(new UD14SearchresultistRequest(null));

        assertEquals(400, response.getCode());
        assertEquals("市场参数不能为空", response.getMsg());
        assertNull(response.getData());
        verify(ud14Mapper, never()).selectVariableByMarket(any());
    }

    @Test
    @DisplayName("[SelectHdocuserdefinedrules] market 为空字符串时应返回400")
    void testSelectHdocuserdefinedrules_MarketEmpty() {
        UD14SearchresultistResponse response = service
                .UD14SelectHdocuserdefinedrules(new UD14SearchresultistRequest(""));

        assertEquals(400, response.getCode());
        assertEquals("市场参数不能为空", response.getMsg());
        assertNull(response.getData());
        verify(ud14Mapper, never()).selectVariableByMarket(any());
    }

    @Test
    @DisplayName("[SelectHdocuserdefinedrules] variableList 为 null 时应返回404")
    void testSelectHdocuserdefinedrules_VariableListNull() {
        when(ud14Mapper.selectVariableByMarket("JP")).thenReturn(null);

        UD14SearchresultistResponse response = service
                .UD14SelectHdocuserdefinedrules(new UD14SearchresultistRequest("JP"));

        assertEquals(404, response.getCode());
        assertEquals("可能有记录不存在", response.getMsg());
        assertNull(response.getData());
        verify(ud14Mapper, times(1)).selectVariableByMarket("JP");
    }

    @Test
    @DisplayName("[SelectHdocuserdefinedrules] variableList 为空列表时应返回404")
    void testSelectHdocuserdefinedrules_VariableListEmpty() {
        when(ud14Mapper.selectVariableByMarket("JP")).thenReturn(Collections.emptyList());

        UD14SearchresultistResponse response = service
                .UD14SelectHdocuserdefinedrules(new UD14SearchresultistRequest("JP"));

        assertEquals(404, response.getCode());
        assertEquals("可能有记录不存在", response.getMsg());
        assertNull(response.getData());
        verify(ud14Mapper, times(1)).selectVariableByMarket("JP");
    }

    @Test
    @DisplayName("[SelectHdocuserdefinedrules] 查询成功时应返回200及变量列表")
    void testSelectHdocuserdefinedrules_Success() {
        when(ud14Mapper.selectVariableByMarket("JP")).thenReturn(Arrays.asList("VAR001", "VAR002"));

        UD14SearchresultistResponse response = service
                .UD14SelectHdocuserdefinedrules(new UD14SearchresultistRequest("JP"));

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());
        @SuppressWarnings("unchecked")
        List<UD14SearchresultistResponse.VariableData> dataList = (List<UD14SearchresultistResponse.VariableData>) response
                .getData();
        assertEquals(2, dataList.size());
        assertEquals("VAR001", dataList.get(0).getVariable());
        assertEquals("VAR002", dataList.get(1).getVariable());
        verify(ud14Mapper, times(1)).selectVariableByMarket("JP");
    }

    @Test
    @DisplayName("[SelectHdocuserdefinedrules] 系统异常时应返回500")
    void testSelectHdocuserdefinedrules_Exception() {
        when(ud14Mapper.selectVariableByMarket(anyString())).thenThrow(new RuntimeException("数据库异常"));

        UD14SearchresultistResponse response = service
                .UD14SelectHdocuserdefinedrules(new UD14SearchresultistRequest("JP"));

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
        verify(ud14Mapper, times(1)).selectVariableByMarket("JP");
    }

    // ====================================================================
    // getMarketFiles 测试
    // ====================================================================

    @Test
    @DisplayName("[getMarketFiles] market 为 null 时应返回400")
    void testGetMarketFiles_MarketNull() {
        UD14SearchresultistResponse response = service.getMarketFiles(new UD14SearchresultistRequest(null));

        assertEquals(400, response.getCode());
        assertEquals("市场参数不能为空", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[getMarketFiles] market 为空字符串时应返回400")
    void testGetMarketFiles_MarketEmpty() {
        UD14SearchresultistResponse response = service.getMarketFiles(new UD14SearchresultistRequest(""));

        assertEquals(400, response.getCode());
        assertEquals("市场参数不能为空", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[getMarketFiles] 文件夹不存在时应返回404")
    void testGetMarketFiles_DirNotExists() {
        withAuth();
        UD14SearchresultistResponse response = service.getMarketFiles(new UD14SearchresultistRequest("NONEXISTENT"));

        assertEquals(404, response.getCode());
        assertEquals("Market文件夹不存在", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[getMarketFiles] 路径存在但不是目录时应返回404")
    void testGetMarketFiles_NotADirectory() throws IOException {
        withAuth();
        // 创建一个文件（不是目录），exists()=true 但 isDirectory()=false
        Files.createFile(new File(marketFolderPath, "JP").toPath());

        UD14SearchresultistResponse response = service.getMarketFiles(new UD14SearchresultistRequest("JP"));

        assertEquals(404, response.getCode());
        assertEquals("Market文件夹不存在", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[getMarketFiles] 空目录时应返回空列表")
    void testGetMarketFiles_EmptyDir() {
        withAuth();
        assertTrue(new File(marketFolderPath, "JP").mkdirs());

        UD14SearchresultistResponse response = service.getMarketFiles(new UD14SearchresultistRequest("JP"));

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());
        @SuppressWarnings("unchecked")
        List<UD14SearchresultistResponse.FileData> fileList = (List<UD14SearchresultistResponse.FileData>) response
                .getData();
        assertTrue(fileList.isEmpty());
    }

    @Test
    @DisplayName("[getMarketFiles] 查询成功：含已使用/未使用文件，子目录被过滤")
    void testGetMarketFiles_Success() throws IOException {
        withAuth();
        File marketDir = new File(marketFolderPath, "JP");
        assertTrue(marketDir.mkdirs());

        Files.createFile(new File(marketDir, "used_file.rtf").toPath());
        Files.createFile(new File(marketDir, "unused_file.rtf").toPath());
        assertTrue(new File(marketDir, "subdir").mkdirs()); // 应被过滤

        when(ud14Mapper.selectVariableByMarketAndFile("JP", "used_file.rtf")).thenReturn("VAR001");
        when(ud14Mapper.selectVariableByMarketAndFile("JP", "unused_file.rtf")).thenReturn(null);

        UD14SearchresultistResponse response = service.getMarketFiles(new UD14SearchresultistRequest("JP"));

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());

        @SuppressWarnings("unchecked")
        List<UD14SearchresultistResponse.FileData> fileList = (List<UD14SearchresultistResponse.FileData>) response
                .getData();
        assertEquals(2, fileList.size());

        UD14SearchresultistResponse.FileData usedFile = fileList.stream()
                .filter(f -> "used_file.rtf".equals(f.getFilename())).findFirst().orElse(null);
        assertNotNull(usedFile);
        assertTrue(usedFile.getIsUsed());
        assertEquals("VAR001", usedFile.getVariable());
        assertNotNull(usedFile.getLastMod());
        assertNotNull(usedFile.getSize());

        UD14SearchresultistResponse.FileData unusedFile = fileList.stream()
                .filter(f -> "unused_file.rtf".equals(f.getFilename())).findFirst().orElse(null);
        assertNotNull(unusedFile);
        assertFalse(unusedFile.getIsUsed());
        assertNull(unusedFile.getVariable());

        verify(ud14Mapper, times(1)).selectVariableByMarketAndFile("JP", "used_file.rtf");
        verify(ud14Mapper, times(1)).selectVariableByMarketAndFile("JP", "unused_file.rtf");
    }

    @Test
    @DisplayName("[getMarketFiles] Mapper 抛出异常时应返回500")
    void testGetMarketFiles_Exception() throws IOException {
        withAuth();
        // 先创建有效目录，使目录存在性检查通过
        File marketDir = new File(marketFolderPath, "JP");
        assertTrue(marketDir.mkdirs());
        Files.createFile(new File(marketDir, "some.rtf").toPath());

        // Mapper 抛出异常 → 进入 catch 块
        when(ud14Mapper.selectVariableByMarketAndFile(anyString(), anyString()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD14SearchresultistResponse response = service.getMarketFiles(new UD14SearchresultistRequest("JP"));

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[authenticateIfNeeded] exitCode==0 时应设置 authenticated=true")
    void testAuthenticateIfNeeded_ExitCodeZero() {
        UD14SearchresultistServiceImpl testService = new UD14SearchresultistServiceImpl() {
            @Override
            protected int executeNetUse(String serverShare, String password, String username) {
                return 0;
            }
        };
        ReflectionTestUtils.setField(testService, "ud14Mapper", ud14Mapper);
        ReflectionTestUtils.setField(testService, "marketFolder", marketFolderPath);
        ReflectionTestUtils.setField(testService, "fileServerUsername", "testuser");
        ReflectionTestUtils.setField(testService, "fileServerPassword", "testpass");

        UD14SearchresultistResponse response = testService
                .getMarketFiles(new UD14SearchresultistRequest("NONEXISTENT"));

        assertEquals(404, response.getCode());
        Boolean authenticated = (Boolean) ReflectionTestUtils.getField(testService, "authenticated");
        assertTrue(authenticated);
    }

    @Test
    @DisplayName("[authenticateIfNeeded] exitCode!=0 时应保持 authenticated=false")
    void testAuthenticateIfNeeded_ExitCodeNonZero() {
        UD14SearchresultistServiceImpl testService = new UD14SearchresultistServiceImpl() {
            @Override
            protected int executeNetUse(String serverShare, String password, String username) {
                return 1;
            }
        };
        ReflectionTestUtils.setField(testService, "ud14Mapper", ud14Mapper);
        ReflectionTestUtils.setField(testService, "marketFolder", marketFolderPath);
        ReflectionTestUtils.setField(testService, "fileServerUsername", "testuser");
        ReflectionTestUtils.setField(testService, "fileServerPassword", "testpass");

        testService.getMarketFiles(new UD14SearchresultistRequest("NONEXISTENT"));

        Boolean authenticated = (Boolean) ReflectionTestUtils.getField(testService, "authenticated");
        assertFalse(authenticated);
    }

    @Test
    @DisplayName("[authenticateIfNeeded] executeNetUse 抛异常时应被空 catch 吞掉")
    void testAuthenticateIfNeeded_ExceptionInNetUse() throws Exception {
        UD14SearchresultistServiceImpl testService = new UD14SearchresultistServiceImpl() {
            @Override
            protected int executeNetUse(String serverShare, String password, String username)
                    throws Exception {
                throw new Exception("模拟网络异常");
            }
        };
        ReflectionTestUtils.setField(testService, "ud14Mapper", ud14Mapper);
        ReflectionTestUtils.setField(testService, "marketFolder", marketFolderPath);
        ReflectionTestUtils.setField(testService, "fileServerUsername", "testuser");
        ReflectionTestUtils.setField(testService, "fileServerPassword", "testpass");

        testService.getMarketFiles(new UD14SearchresultistRequest("NONEXISTENT"));

        // 异常被空 catch 吞掉，authenticated 保持 false
        Boolean authenticated = (Boolean) ReflectionTestUtils.getField(testService, "authenticated");
        assertFalse(authenticated);
    }

    // ====================================================================
    // formatFileSize 间接测试（通过 getMarketFiles 返回值验证各分支）
    // ====================================================================

    @Test
    @DisplayName("[formatFileSize] 文件大小为0时应返回0 B")
    void testFormatFileSize_Zero() throws IOException {
        withAuth();
        File marketDir = new File(marketFolderPath, "JP");
        assertTrue(marketDir.mkdirs());
        Files.createFile(new File(marketDir, "empty.rtf").toPath());

        when(ud14Mapper.selectVariableByMarketAndFile("JP", "empty.rtf")).thenReturn(null);

        UD14SearchresultistResponse response = service.getMarketFiles(new UD14SearchresultistRequest("JP"));

        assertEquals(200, response.getCode());
        @SuppressWarnings("unchecked")
        List<UD14SearchresultistResponse.FileData> fileList = (List<UD14SearchresultistResponse.FileData>) response
                .getData();
        assertEquals("0 B", fileList.get(0).getSize());
    }

    @Test
    @DisplayName("[formatFileSize] 文件大小小于1KB时应显示为B")
    void testFormatFileSize_Bytes() throws IOException {
        withAuth();
        File marketDir = new File(marketFolderPath, "JP");
        assertTrue(marketDir.mkdirs());
        Files.write(new File(marketDir, "small.rtf").toPath(), new byte[500]);

        when(ud14Mapper.selectVariableByMarketAndFile("JP", "small.rtf")).thenReturn(null);

        UD14SearchresultistResponse response = service.getMarketFiles(new UD14SearchresultistRequest("JP"));

        assertEquals(200, response.getCode());
        @SuppressWarnings("unchecked")
        List<UD14SearchresultistResponse.FileData> fileList = (List<UD14SearchresultistResponse.FileData>) response
                .getData();
        assertEquals("500.0 B", fileList.get(0).getSize());
    }

    @Test
    @DisplayName("[formatFileSize] 文件大小超过1KB时应显示为KB")
    void testFormatFileSize_KiloBytes() throws IOException {
        withAuth();
        File marketDir = new File(marketFolderPath, "JP");
        assertTrue(marketDir.mkdirs());
        Files.write(new File(marketDir, "medium.rtf").toPath(), new byte[3 * 1024]);

        when(ud14Mapper.selectVariableByMarketAndFile("JP", "medium.rtf")).thenReturn(null);

        UD14SearchresultistResponse response = service.getMarketFiles(new UD14SearchresultistRequest("JP"));

        assertEquals(200, response.getCode());
        @SuppressWarnings("unchecked")
        List<UD14SearchresultistResponse.FileData> fileList = (List<UD14SearchresultistResponse.FileData>) response
                .getData();
        assertEquals("3.0 KB", fileList.get(0).getSize());
    }

    @Test
    @DisplayName("[formatFileSize] 文件大小超过1MB时应显示为MB")
    void testFormatFileSize_MegaBytes() throws IOException {
        withAuth();
        File marketDir = new File(marketFolderPath, "JP");
        assertTrue(marketDir.mkdirs());
        Files.write(new File(marketDir, "large.rtf").toPath(), new byte[2 * 1024 * 1024]);

        when(ud14Mapper.selectVariableByMarketAndFile("JP", "large.rtf")).thenReturn(null);

        UD14SearchresultistResponse response = service.getMarketFiles(new UD14SearchresultistRequest("JP"));

        assertEquals(200, response.getCode());
        @SuppressWarnings("unchecked")
        List<UD14SearchresultistResponse.FileData> fileList = (List<UD14SearchresultistResponse.FileData>) response
                .getData();
        assertEquals("2.0 MB", fileList.get(0).getSize());
    }
}
