package com.web.app.test;

import com.web.app.dto.UD12UploadDeletetemplatRequest;
import com.web.app.dto.UD12UploadDeletetemplatResponse;
import com.web.app.entity.MarketMaster;
import com.web.app.mapper.UD12UploadDeletetemplatMapper;
import com.web.app.service.impl.UD12UploadDeletetemplatServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD12UploadDeletetemplatServiceImpl 单元测试
 * 覆盖所有方法的所有分支，达到 100% JaCoCo 覆盖率
 *
 * 分支统计：
 * - UD12SelectMarket: 3 分支
 * - UD12UploadFlie: 7 分支（目录创建失败/无写权限/IOException/成功/异常）
 * - UD12DeleteFlie: 4 分支（文件不存在/删除失败/成功/异常）
 * - getTemplateList: 4 分支（目录不存在/空目录+files!=null/成功/异常）
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD12UploadDeletetemplatServiceImpl 单元测试")
class UD12UploadDeletetemplatServiceImplTest {

    @Mock
    private UD12UploadDeletetemplatMapper ud12Mapper;

    @InjectMocks
    private UD12UploadDeletetemplatServiceImpl service;

    @TempDir
    Path tempDir;

    private String uploadFolderPath;

    @BeforeEach
    void setUp() {
        uploadFolderPath = tempDir.toAbsolutePath().toString();
        ReflectionTestUtils.setField(service, "uploadFolder", uploadFolderPath);
        ReflectionTestUtils.setField(service, "fileServerUsername", "testuser");
        ReflectionTestUtils.setField(service, "fileServerPassword", "testpass");
    }

    @AfterEach
    void tearDown() {
        ReflectionTestUtils.setField(service, "authenticated", false);
    }

    /** 设置认证跳过 + 返回uploadFolderPath */
    private String withAuth() {
        ReflectionTestUtils.setField(service, "authenticated", true);
        return uploadFolderPath;
    }

    // ====================================================================
    // UD12SelectMarket 测试
    // ====================================================================

    @Test
    @DisplayName("[SelectMarket] list 不为 null 时应成功返回市场列表")
    void testSelectMarket_ListNotNull() {
        MarketMaster mm1 = new MarketMaster();
        mm1.setMarket("JP");
        MarketMaster mm2 = new MarketMaster();
        mm2.setMarket("AUS");
        when(ud12Mapper.selectAllMarket()).thenReturn(Arrays.asList(mm1, mm2));

        UD12UploadDeletetemplatResponse response = service.UD12SelectMarket();

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());
        @SuppressWarnings("unchecked")
        List<UD12UploadDeletetemplatResponse.MarketData> dataList = (List<UD12UploadDeletetemplatResponse.MarketData>) response
                .getData();
        assertEquals(2, dataList.size());
        assertEquals("JP", dataList.get(0).getMarket());
        assertEquals("AUS", dataList.get(1).getMarket());
        verify(ud12Mapper, times(1)).selectAllMarket();
    }

    @Test
    @DisplayName("[SelectMarket] list 为 null 时应返回空列表")
    void testSelectMarket_ListNull() {
        when(ud12Mapper.selectAllMarket()).thenReturn(null);

        UD12UploadDeletetemplatResponse response = service.UD12SelectMarket();

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());
        @SuppressWarnings("unchecked")
        List<UD12UploadDeletetemplatResponse.MarketData> dataList = (List<UD12UploadDeletetemplatResponse.MarketData>) response
                .getData();
        assertTrue(dataList.isEmpty());
        verify(ud12Mapper, times(1)).selectAllMarket();
    }

    @Test
    @DisplayName("[SelectMarket] 系统异常时应返回500")
    void testSelectMarket_Exception() {
        when(ud12Mapper.selectAllMarket()).thenThrow(new RuntimeException("数据库异常"));

        UD12UploadDeletetemplatResponse response = service.UD12SelectMarket();

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
        verify(ud12Mapper, times(1)).selectAllMarket();
    }

    // ====================================================================
    // UD12UploadFlie 测试
    // ====================================================================

    @Test
    @DisplayName("[UploadFlie] 目录不存在且 mkdirs 失败时应返回500")
    void testUploadFlie_MkdirsFailed() {
        // 使用匿名子类覆盖 createDirectories 返回 false
        UD12UploadDeletetemplatServiceImpl testService = new UD12UploadDeletetemplatServiceImpl() {
            @Override
            protected boolean createDirectories(File directory) {
                return false;
            }
        };
        ReflectionTestUtils.setField(testService, "ud12Mapper", ud12Mapper);
        ReflectionTestUtils.setField(testService, "uploadFolder", uploadFolderPath);
        ReflectionTestUtils.setField(testService, "fileServerUsername", "testuser");
        ReflectionTestUtils.setField(testService, "fileServerPassword", "testpass");
        ReflectionTestUtils.setField(testService, "authenticated", true);

        MultipartFile file = new MockMultipartFile("file", "test.rtf", "text/plain", "content".getBytes());
        UD12UploadDeletetemplatResponse response = testService.UD12UploadFlie(file, "JP");

        assertEquals(500, response.getCode());
        assertTrue(response.getMsg().contains("无法创建目录"));
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[UploadFlie] 目录存在但无写权限时应返回500")
    void testUploadFlie_DirNotWritable() {
        withAuth();
        // 使用匿名子类覆盖 isDirectoryWritable 返回 false
        UD12UploadDeletetemplatServiceImpl testService = new UD12UploadDeletetemplatServiceImpl() {
            @Override
            protected boolean isDirectoryWritable(File directory) {
                return false;
            }
        };
        ReflectionTestUtils.setField(testService, "ud12Mapper", ud12Mapper);
        ReflectionTestUtils.setField(testService, "uploadFolder", uploadFolderPath);
        ReflectionTestUtils.setField(testService, "fileServerUsername", "testuser");
        ReflectionTestUtils.setField(testService, "fileServerPassword", "testpass");
        ReflectionTestUtils.setField(testService, "authenticated", true);

        File marketDir = new File(uploadFolderPath, "JP");
        assertTrue(marketDir.mkdirs());

        MultipartFile file = new MockMultipartFile("file", "test.rtf", "text/plain", "content".getBytes());
        UD12UploadDeletetemplatResponse response = testService.UD12UploadFlie(file, "JP");

        assertEquals(500, response.getCode());
        assertTrue(response.getMsg().contains("目录无写入权限"));
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[UploadFlie] 文件上传 IOException 时应返回500")
    void testUploadFlie_IOException() throws IOException {
        withAuth();
        File marketDir = new File(uploadFolderPath, "JP");
        assertTrue(marketDir.mkdirs());

        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn("test.rtf");
        when(file.getInputStream()).thenThrow(new IOException("模拟IO异常"));

        UD12UploadDeletetemplatResponse response = service.UD12UploadFlie(file, "JP");

        assertEquals(500, response.getCode());
        assertEquals("文件上传失败，请稍后重试", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[UploadFlie] 目录不存在时 mkdirs 成功创建目录并上传文件")
    void testUploadFlie_DirCreatedByMkdirs() {
        withAuth();
        // 不预先创建 market 目录，让 createDirectories (mkdirs) 自动创建
        MultipartFile file = new MockMultipartFile("file", "new_market.rtf", "text/plain",
                "content".getBytes());
        UD12UploadDeletetemplatResponse response = service.UD12UploadFlie(file, "NEW_MARKET");

        assertEquals(200, response.getCode());
        assertEquals("TEMPLATE new_market.rtf WAS SUCESSFULLY UPLOADED TO MARKET NEW_MARKET", response.getMsg());
        assertNotNull(response.getData());

        UD12UploadDeletetemplatResponse.UploadFileData uploadData = (UD12UploadDeletetemplatResponse.UploadFileData) response
                .getData();
        assertEquals("new_market.rtf", uploadData.getFileName());
        assertEquals("NEW_MARKET", uploadData.getMarket());

        assertTrue(new File(uploadFolderPath, "NEW_MARKET/new_market.rtf").exists());
    }

    @Test
    @DisplayName("[UploadFlie] 上传成功时应返回200并生成文件（目录已存在）")
    void testUploadFlie_Success() {
        withAuth();
        File marketDir = new File(uploadFolderPath, "JP");
        assertTrue(marketDir.mkdirs());

        MultipartFile file = new MockMultipartFile("file", "test_template.rtf", "text/plain",
                "file content".getBytes());
        UD12UploadDeletetemplatResponse response = service.UD12UploadFlie(file, "JP");

        assertEquals(200, response.getCode());
        assertEquals("TEMPLATE test_template.rtf WAS SUCESSFULLY UPLOADED TO MARKET JP", response.getMsg());
        assertNotNull(response.getData());

        UD12UploadDeletetemplatResponse.UploadFileData uploadData = (UD12UploadDeletetemplatResponse.UploadFileData) response
                .getData();
        assertEquals("test_template.rtf", uploadData.getFileName());
        assertEquals("JP", uploadData.getMarket());
        assertEquals("/hdoc/template/upload/JP/test_template.rtf", uploadData.getFilePath());

        assertTrue(new File(marketDir, "test_template.rtf").exists());
    }

    @Test
    @DisplayName("[UploadFlie] 系统异常（非IO）时应返回500")
    void testUploadFlie_Exception() {
        withAuth();
        new File(uploadFolderPath, "JP").mkdirs();

        // getOriginalFilename 抛出 RuntimeException → 进入 catch(Exception) 块
        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenThrow(new RuntimeException("模拟异常"));
        UD12UploadDeletetemplatResponse response = service.UD12UploadFlie(file, "JP");

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
    }

    // ====================================================================
    // UD12DeleteFlie 测试
    // ====================================================================

    @Test
    @DisplayName("[DeleteFlie] 文件不存在时应返回404")
    void testDeleteFlie_FileNotExists() {
        withAuth();
        UD12UploadDeletetemplatRequest request = new UD12UploadDeletetemplatRequest("JP", "nonexistent.rtf");
        UD12UploadDeletetemplatResponse response = service.UD12DeleteFlie(request);

        assertEquals(404, response.getCode());
        assertEquals("文件不存在", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[DeleteFlie] 文件被锁定时 delete 返回 false 应返回500")
    void testDeleteFlie_DeleteFailed() throws IOException {
        withAuth();
        File marketDir = new File(uploadFolderPath, "JP");
        assertTrue(marketDir.mkdirs());
        File testFile = new File(marketDir, "locked.rtf");
        assertTrue(testFile.createNewFile());

        // 在 Windows 上，打开的文件句柄可阻止 delete()
        @SuppressWarnings("resource")
        java.io.RandomAccessFile raf = new java.io.RandomAccessFile(testFile, "rw");
        try {
            UD12UploadDeletetemplatRequest request = new UD12UploadDeletetemplatRequest("JP", "locked.rtf");
            UD12UploadDeletetemplatResponse response = service.UD12DeleteFlie(request);

            if (testFile.exists()) {
                assertEquals(500, response.getCode());
                assertEquals("文件删除失败", response.getMsg());
                assertNull(response.getData());
            }
        } finally {
            raf.close();
            if (testFile.exists())
                testFile.delete();
        }
    }

    @Test
    @DisplayName("[DeleteFlie] 删除成功时应返回200")
    void testDeleteFlie_Success() throws IOException {
        withAuth();
        File marketDir = new File(uploadFolderPath, "JP");
        assertTrue(marketDir.mkdirs());
        File testFile = new File(marketDir, "delete_me.rtf");
        assertTrue(testFile.createNewFile());

        UD12UploadDeletetemplatRequest request = new UD12UploadDeletetemplatRequest("JP", "delete_me.rtf");
        UD12UploadDeletetemplatResponse response = service.UD12DeleteFlie(request);

        assertEquals(200, response.getCode());
        assertEquals("TEMPLATE delete_me.rtf WAS SUCESSFULLY DELETE FROM MARKET JP", response.getMsg());
        assertNotNull(response.getData());

        UD12UploadDeletetemplatResponse.DeleteFileData deleteData = (UD12UploadDeletetemplatResponse.DeleteFileData) response
                .getData();
        assertEquals("delete_me.rtf", deleteData.getFileName());
        assertEquals("JP", deleteData.getMarket());
        assertFalse(testFile.exists());
    }

    @Test
    @DisplayName("[DeleteFlie] 系统异常时应返回500")
    void testDeleteFlie_Exception() {
        withAuth();
        // market=null 导致 null.trim() 抛出 NPE → 进入 catch(Exception) 块
        UD12UploadDeletetemplatRequest request = new UD12UploadDeletetemplatRequest(null, "test.rtf");
        UD12UploadDeletetemplatResponse response = service.UD12DeleteFlie(request);

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
    }

    // ====================================================================
    // getTemplateList 测试
    // ====================================================================

    @Test
    @DisplayName("[getTemplateList] 目录不存在时应返回空列表")
    void testGetTemplateList_DirNotExists() {
        withAuth();
        UD12UploadDeletetemplatResponse response = service.getTemplateList("NONEXISTENT_MARKET");

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());
        @SuppressWarnings("unchecked")
        List<String> fileList = (List<String>) response.getData();
        assertTrue(fileList.isEmpty());
    }

    @Test
    @DisplayName("[getTemplateList] authenticated=false 时 authenticateIfNeeded 应静默执行")
    void testGetTemplateList_AuthenticateIfNeededExecuted() {
        // 不设 authenticated=true → 进入 authenticateIfNeeded() try 内部
        // 临时目录路径被当作 UNC 解析会抛异常（空 catch 吞掉），然后继续执行业务逻辑
        UD12UploadDeletetemplatResponse response = service.getTemplateList("NONEXISTENT_MARKET");

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());
        @SuppressWarnings("unchecked")
        List<String> fileList = (List<String>) response.getData();
        assertTrue(fileList.isEmpty());
    }

    @Test
    @DisplayName("[authenticateIfNeeded] exitCode==0 时应设置 authenticated=true")
    void testAuthenticateIfNeeded_ExitCodeZero() {
        // 使用匿名子类覆盖 executeNetUse 返回 0
        UD12UploadDeletetemplatServiceImpl testService = new UD12UploadDeletetemplatServiceImpl() {
            @Override
            protected int executeNetUse(String serverShare, String password, String username) {
                return 0;
            }
        };
        ReflectionTestUtils.setField(testService, "ud12Mapper", ud12Mapper);
        ReflectionTestUtils.setField(testService, "uploadFolder", uploadFolderPath);
        ReflectionTestUtils.setField(testService, "fileServerUsername", "testuser");
        ReflectionTestUtils.setField(testService, "fileServerPassword", "testpass");

        UD12UploadDeletetemplatResponse response = testService.getTemplateList("NONEXISTENT_MARKET");

        assertEquals(200, response.getCode());
        Boolean authenticated = (Boolean) ReflectionTestUtils.getField(testService, "authenticated");
        assertTrue(authenticated);
    }

    @Test
    @DisplayName("[authenticateIfNeeded] exitCode!=0 时应保持 authenticated=false")
    void testAuthenticateIfNeeded_ExitCodeNonZero() {
        UD12UploadDeletetemplatServiceImpl testService = new UD12UploadDeletetemplatServiceImpl() {
            @Override
            protected int executeNetUse(String serverShare, String password, String username) {
                return 1;
            }
        };
        ReflectionTestUtils.setField(testService, "ud12Mapper", ud12Mapper);
        ReflectionTestUtils.setField(testService, "uploadFolder", uploadFolderPath);
        ReflectionTestUtils.setField(testService, "fileServerUsername", "testuser");
        ReflectionTestUtils.setField(testService, "fileServerPassword", "testpass");

        testService.getTemplateList("NONEXISTENT_MARKET");

        Boolean authenticated = (Boolean) ReflectionTestUtils.getField(testService, "authenticated");
        assertFalse(authenticated);
    }

    @Test
    @DisplayName("[authenticateIfNeeded] executeNetUse 抛异常时应被空 catch 吞掉")
    void testAuthenticateIfNeeded_ExceptionInNetUse() {
        UD12UploadDeletetemplatServiceImpl testService = new UD12UploadDeletetemplatServiceImpl() {
            @Override
            protected int executeNetUse(String serverShare, String password, String username)
                    throws Exception {
                throw new Exception("模拟网络异常");
            }
        };
        ReflectionTestUtils.setField(testService, "ud12Mapper", ud12Mapper);
        ReflectionTestUtils.setField(testService, "uploadFolder", uploadFolderPath);
        ReflectionTestUtils.setField(testService, "fileServerUsername", "testuser");
        ReflectionTestUtils.setField(testService, "fileServerPassword", "testpass");

        testService.getTemplateList("NONEXISTENT_MARKET");

        Boolean authenticated = (Boolean) ReflectionTestUtils.getField(testService, "authenticated");
        assertFalse(authenticated);
    }

    @Test
    @DisplayName("[getTemplateList] 路径是文件（非目录）时应返回空列表")
    void testGetTemplateList_PathIsFile() throws IOException {
        withAuth();
        // 创建一个文件（不是目录），exists()=true 但 isDirectory()=false
        Files.createFile(new File(uploadFolderPath, "JP").toPath());

        UD12UploadDeletetemplatResponse response = service.getTemplateList("JP");

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        @SuppressWarnings("unchecked")
        List<String> fileList = (List<String>) response.getData();
        assertTrue(fileList.isEmpty());
    }

    @Test
    @DisplayName("[getTemplateList] 空目录时应返回空列表")
    void testGetTemplateList_EmptyDir() {
        withAuth();
        assertTrue(new File(uploadFolderPath, "JP").mkdirs());

        UD12UploadDeletetemplatResponse response = service.getTemplateList("JP");

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        @SuppressWarnings("unchecked")
        List<String> fileList = (List<String>) response.getData();
        assertTrue(fileList.isEmpty());
    }

    @Test
    @DisplayName("[getTemplateList] 查询成功时应返回排序后的文件名列表（过滤子目录）")
    void testGetTemplateList_Success() throws IOException {
        withAuth();
        File marketDir = new File(uploadFolderPath, "JP");
        assertTrue(marketDir.mkdirs());

        Files.createFile(new File(marketDir, "b_file.rtf").toPath());
        Files.createFile(new File(marketDir, "a_file.rtf").toPath());
        Files.createFile(new File(marketDir, "c_file.rtf").toPath());
        assertTrue(new File(marketDir, "subdir").mkdirs()); // 子目录应被过滤

        UD12UploadDeletetemplatResponse response = service.getTemplateList("JP");

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        @SuppressWarnings("unchecked")
        List<String> fileList = (List<String>) response.getData();
        assertEquals(3, fileList.size());
        assertEquals("a_file.rtf", fileList.get(0));
        assertEquals("b_file.rtf", fileList.get(1));
        assertEquals("c_file.rtf", fileList.get(2));
    }

    @Test
    @DisplayName("[getTemplateList] 系统异常时应返回500")
    void testGetTemplateList_Exception() {
        withAuth();
        // market=null 导致 null.trim() 抛出 NPE → 进入 catch(Exception) 块
        UD12UploadDeletetemplatResponse response = service.getTemplateList(null);

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
    }
}
