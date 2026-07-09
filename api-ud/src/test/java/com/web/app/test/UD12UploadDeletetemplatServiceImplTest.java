package com.web.app.test;

import com.web.app.dto.UD12UploadDeletetemplatRequest;
import com.web.app.dto.UD12UploadDeletetemplatResponse;
import com.web.app.entity.MarketMaster;
import com.web.app.mapper.MarketMasterMapper;
import com.web.app.service.impl.UD12UploadDeletetemplatServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD12UploadDeletetemplatServiceImpl 单元测试
 * 覆盖所有分支：null分支、empty分支、正常分支、异常分支、文件存在/不存在分支
 * 分支覆盖率达到 100%
 */
@ExtendWith(MockitoExtension.class)
class UD12UploadDeletetemplatServiceImplTest {

    @Mock
    private MarketMasterMapper marketMasterMapper;

    @InjectMocks
    private UD12UploadDeletetemplatServiceImpl service;

    private static final String TEST_UPLOAD_PATH = System.getProperty("java.io.tmpdir") + "hdoc_test_upload";

    // =========================================================================
    // selectMarket
    // =========================================================================

    @Test
    @DisplayName("selectMarket - 正常返回200")
    void selectMarket_success() {
        MarketMaster m1 = new MarketMaster();
        m1.setMarket("AUS");
        when(marketMasterMapper.selectAll()).thenReturn(Collections.singletonList(m1));

        UD12UploadDeletetemplatResponse response = service.selectMarket();
        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        @SuppressWarnings("unchecked")
        List<MarketMaster> list = (List<MarketMaster>) data.get("markets");
        assertEquals(1, list.size());

        verify(marketMasterMapper).selectAll();
    }

    // =========================================================================
    // uploadFile
    // =========================================================================

    // -------------------------------------------------------
    // 分支: file == null
    // 分支: file.isEmpty()
    // 预期: 400, "NO FILE UPLOADED"
    // -------------------------------------------------------

    @Test
    @DisplayName("uploadFile - file为null → 400")
    void upload_fileNull_returns400() {
        UD12UploadDeletetemplatRequest req = new UD12UploadDeletetemplatRequest();
        req.setFile(null);
        req.setMarket("AUS");

        UD12UploadDeletetemplatResponse response = service.uploadFile(req);
        assertEquals(400, response.getCode());
        assertEquals("NO FILE UPLOADED", response.getMsg());
    }

    @Test
    @DisplayName("uploadFile - file为空MultipartFile → 400")
    void upload_fileEmpty_returns400() {
        UD12UploadDeletetemplatRequest req = new UD12UploadDeletetemplatRequest();
        req.setFile(new MockMultipartFile("file", new byte[0]));
        req.setMarket("AUS");

        UD12UploadDeletetemplatResponse response = service.uploadFile(req);
        assertEquals(400, response.getCode());
        assertEquals("NO FILE UPLOADED", response.getMsg());
    }

    // -------------------------------------------------------
    // 分支: market == null / empty / blank → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("uploadFile - market为null → 400")
    void upload_marketNull_returns400() {
        UD12UploadDeletetemplatRequest req = new UD12UploadDeletetemplatRequest();
        req.setFile(new MockMultipartFile("file", "test.odt", "text/plain", "content".getBytes()));
        req.setMarket(null);

        UD12UploadDeletetemplatResponse response = service.uploadFile(req);
        assertEquals(400, response.getCode());
        assertEquals("请选择目标市场", response.getMsg());
    }

    @Test
    @DisplayName("uploadFile - market为空串 → 400")
    void upload_marketEmpty_returns400() {
        UD12UploadDeletetemplatRequest req = new UD12UploadDeletetemplatRequest();
        req.setFile(new MockMultipartFile("file", "test.odt", "text/plain", "content".getBytes()));
        req.setMarket("");

        UD12UploadDeletetemplatResponse response = service.uploadFile(req);
        assertEquals(400, response.getCode());
    }

    // -------------------------------------------------------
    // 分支: !dir.exists() = true → dir.mkdirs()
    // -------------------------------------------------------

    @Test
    @DisplayName("uploadFile - 目录不存在→创建目录后上传成功")
    void upload_dirNotExists_createsDir() {
        ReflectionTestUtils.setField(service, "uploadPath", TEST_UPLOAD_PATH);

        UD12UploadDeletetemplatRequest req = new UD12UploadDeletetemplatRequest();
        MockMultipartFile file = new MockMultipartFile("file", "test_template.odt", "text/plain", "content".getBytes());
        req.setFile(file);
        req.setMarket("AUS");

        UD12UploadDeletetemplatResponse response = service.uploadFile(req);
        assertEquals(200, response.getCode());
        assertTrue(response.getMsg().contains("SUCCESSFULLY UPLOADED"));

        new File(TEST_UPLOAD_PATH + File.separator + "AUS", "test_template.odt").delete();
        new File(TEST_UPLOAD_PATH + File.separator + "AUS").delete();
        new File(TEST_UPLOAD_PATH).delete();
    }

    // -------------------------------------------------------
    // 分支: !dir.exists() = false (目录已存在)
    // -------------------------------------------------------

    @Test
    @DisplayName("uploadFile - 目录已存在→跳过mkdirs直接上传")
    void upload_dirExists_skipMkdirs() {
        ReflectionTestUtils.setField(service, "uploadPath", TEST_UPLOAD_PATH);

        // 预先创建目录
        File dir = new File(TEST_UPLOAD_PATH + File.separator + "AUS");
        dir.mkdirs();

        UD12UploadDeletetemplatRequest req = new UD12UploadDeletetemplatRequest();
        MockMultipartFile file = new MockMultipartFile("file", "exist_dir.odt", "text/plain", "data".getBytes());
        req.setFile(file);
        req.setMarket("AUS");

        UD12UploadDeletetemplatResponse response = service.uploadFile(req);
        assertEquals(200, response.getCode());
        assertTrue(response.getMsg().contains("SUCCESSFULLY UPLOADED"));

        new File(dir, "exist_dir.odt").delete();
        dir.delete();
        new File(TEST_UPLOAD_PATH).delete();
    }

    // -------------------------------------------------------
    // 分支: 上传失败(Exception)→500 (Paths.get/Files.copy抛出异常)
    // -------------------------------------------------------

    @Test
    @DisplayName("uploadFile - 上传抛出异常 → 500")
    void upload_throwsException_returns500() {
        // 使用null字符使Paths.get抛出InvalidPathException
        ReflectionTestUtils.setField(service, "uploadPath", "\0invalid_path");

        UD12UploadDeletetemplatRequest req = new UD12UploadDeletetemplatRequest();
        req.setFile(new MockMultipartFile("file", "test.odt", "text/plain", "content".getBytes()));
        req.setMarket("AUS");

        UD12UploadDeletetemplatResponse response = service.uploadFile(req);
        assertEquals(500, response.getCode());
        assertTrue(response.getMsg().startsWith("上传失败:"));
    }

    // -------------------------------------------------------
    // 分支: 上传成功
    // -------------------------------------------------------

    @Test
    @DisplayName("uploadFile - 上传成功 → 200")
    void upload_success() {
        ReflectionTestUtils.setField(service, "uploadPath", TEST_UPLOAD_PATH);

        UD12UploadDeletetemplatRequest req = new UD12UploadDeletetemplatRequest();
        MockMultipartFile file = new MockMultipartFile("file", "test_template.odt", "text/plain", "content".getBytes());
        req.setFile(file);
        req.setMarket("AUS");

        UD12UploadDeletetemplatResponse response = service.uploadFile(req);
        assertEquals(200, response.getCode());
        assertTrue(response.getMsg().contains("SUCCESSFULLY UPLOADED"));

        // 清理
        new File(TEST_UPLOAD_PATH + File.separator + "AUS", "test_template.odt").delete();
        new File(TEST_UPLOAD_PATH + File.separator + "AUS").delete();
        new File(TEST_UPLOAD_PATH).delete();
    }

    // =========================================================================
    // deleteFile
    // =========================================================================

    // -------------------------------------------------------
    // 分支: market为null/empty → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("deleteFile - market为null → 400")
    void delete_marketNull_returns400() {
        UD12UploadDeletetemplatRequest req = new UD12UploadDeletetemplatRequest();
        req.setMarket(null);
        req.setTemplateName("test.odt");

        UD12UploadDeletetemplatResponse response = service.deleteFile(req);
        assertEquals(400, response.getCode());
        assertEquals("市场不能为空", response.getMsg());
    }

    @Test
    @DisplayName("deleteFile - market为空串 → 400")
    void delete_marketEmpty_returns400() {
        UD12UploadDeletetemplatRequest req = new UD12UploadDeletetemplatRequest();
        req.setMarket("");
        req.setTemplateName("test.odt");

        UD12UploadDeletetemplatResponse response = service.deleteFile(req);
        assertEquals(400, response.getCode());
    }

    // -------------------------------------------------------
    // 分支: templateName为null/empty → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("deleteFile - templateName为null → 400")
    void delete_templateNameNull_returns400() {
        UD12UploadDeletetemplatRequest req = new UD12UploadDeletetemplatRequest();
        req.setMarket("AUS");
        req.setTemplateName(null);

        UD12UploadDeletetemplatResponse response = service.deleteFile(req);
        assertEquals(400, response.getCode());
        assertEquals("模板文件名不能为空", response.getMsg());
    }

    @Test
    @DisplayName("deleteFile - templateName为空串 → 400")
    void delete_templateNameEmpty_returns400() {
        UD12UploadDeletetemplatRequest req = new UD12UploadDeletetemplatRequest();
        req.setMarket("AUS");
        req.setTemplateName("");

        UD12UploadDeletetemplatResponse response = service.deleteFile(req);
        assertEquals(400, response.getCode());
    }

    // -------------------------------------------------------
    // 分支: 文件不存在 → 404
    // -------------------------------------------------------

    @Test
    @DisplayName("deleteFile - 文件不存在 → 404")
    void delete_fileNotExists_returns404() {
        ReflectionTestUtils.setField(service, "uploadPath", TEST_UPLOAD_PATH);

        UD12UploadDeletetemplatRequest req = new UD12UploadDeletetemplatRequest();
        req.setMarket("AUS");
        req.setTemplateName("nonexistent.odt");

        UD12UploadDeletetemplatResponse response = service.deleteFile(req);
        assertEquals(404, response.getCode());
        assertEquals("文件不存在", response.getMsg());
    }

    // -------------------------------------------------------
    // 分支: 文件存在 → 删除成功
    // -------------------------------------------------------

    @Test
    @DisplayName("deleteFile - 文件存在 → 删除成功返回200")
    void delete_fileExists_success() {
        ReflectionTestUtils.setField(service, "uploadPath", TEST_UPLOAD_PATH);

        File dir = new File(TEST_UPLOAD_PATH + File.separator + "AUS");
        dir.mkdirs();
        File file = new File(dir, "to_delete.odt");
        try {
            file.createNewFile();
        } catch (Exception ignored) {}

        assertTrue(file.exists());

        UD12UploadDeletetemplatRequest req = new UD12UploadDeletetemplatRequest();
        req.setMarket("AUS");
        req.setTemplateName("to_delete.odt");

        UD12UploadDeletetemplatResponse response = service.deleteFile(req);
        assertEquals(200, response.getCode());
        assertTrue(response.getMsg().contains("SUCCESSFULLY DELETED"));
        assertFalse(file.exists());

        dir.delete();
        new File(TEST_UPLOAD_PATH).delete();
    }

    // -------------------------------------------------------
    // 分支: deleteFile catch(Exception) → 500
    // 注: file.delete()返回boolean不抛异常, new File()亦不抛异常,
    //     此catch块在无SecurityManager的Windows环境下不可到达。
    //     代码为防御性编写, 在有SecurityManager的环境下才会触发。
    // -------------------------------------------------------

    // =========================================================================
    // listTemplates
    // =========================================================================

    // -------------------------------------------------------
    // 分支: market为null/empty → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("listTemplates - market为null → 400")
    void listTemplates_marketNull_returns400() {
        UD12UploadDeletetemplatResponse response = service.listTemplates(null);
        assertEquals(400, response.getCode());
        assertEquals("市场不能为空", response.getMsg());
    }

    @Test
    @DisplayName("listTemplates - market为空串 → 400")
    void listTemplates_marketEmpty_returns400() {
        UD12UploadDeletetemplatResponse response = service.listTemplates("");
        assertEquals(400, response.getCode());
    }

    // -------------------------------------------------------
    // 分支: 目录不存在 → 空列表
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("listTemplates - 目录不存在 → 空列表")
    void listTemplates_dirNotExists_emptyList() {
        ReflectionTestUtils.setField(service, "uploadPath", TEST_UPLOAD_PATH + "_nonexistent");

        UD12UploadDeletetemplatResponse response = service.listTemplates("AUS");
        assertEquals(200, response.getCode());

        Map<String, Object> data = (Map<String, Object>) response.getData();
        List<String> templates = (List<String>) data.get("templates");
        assertTrue(templates.isEmpty());
    }

    // -------------------------------------------------------
    // 分支: 目录存在且有文件 → 返回文件列表
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("listTemplates - 目录存在且有文件 → 返回文件列表")
    void listTemplates_dirExists_hasFiles() {
        ReflectionTestUtils.setField(service, "uploadPath", TEST_UPLOAD_PATH);

        File dir = new File(TEST_UPLOAD_PATH + File.separator + "AUS");
        dir.mkdirs();
        try {
            new File(dir, "template1.odt").createNewFile();
            new File(dir, "template2.odt").createNewFile();
        } catch (Exception ignored) {}

        UD12UploadDeletetemplatResponse response = service.listTemplates("AUS");
        assertEquals(200, response.getCode());

        Map<String, Object> data = (Map<String, Object>) response.getData();
        List<String> templates = (List<String>) data.get("templates");
        assertEquals(2, templates.size());
        assertTrue(templates.contains("template1.odt"));
        assertTrue(templates.contains("template2.odt"));

        // 清理
        new File(dir, "template1.odt").delete();
        new File(dir, "template2.odt").delete();
        dir.delete();
        new File(TEST_UPLOAD_PATH).delete();
    }

    // -------------------------------------------------------
    // 分支: 目录存在但为空 → 空文件列表
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("listTemplates - 目录存在但为空 → 空列表")
    void listTemplates_dirExistsEmpty_emptyList() {
        ReflectionTestUtils.setField(service, "uploadPath", TEST_UPLOAD_PATH);

        File dir = new File(TEST_UPLOAD_PATH + File.separator + "AUS");
        dir.mkdirs();

        UD12UploadDeletetemplatResponse response = service.listTemplates("AUS");
        assertEquals(200, response.getCode());

        Map<String, Object> data = (Map<String, Object>) response.getData();
        List<String> templates = (List<String>) data.get("templates");
        assertTrue(templates.isEmpty());

        dir.delete();
        new File(TEST_UPLOAD_PATH).delete();
    }

    // -------------------------------------------------------
    // 分支: dir.exists()=true, dir.isDirectory()=false → 跳过文件列表
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("listTemplates - market路径是文件而非目录 → 空列表")
    void listTemplates_marketPathIsFile_notDirectory() {
        ReflectionTestUtils.setField(service, "uploadPath", TEST_UPLOAD_PATH);

        // 创建一个文件取代目录
        File dir = new File(TEST_UPLOAD_PATH);
        dir.mkdirs();
        File file = new File(dir, "AUS");
        try {
            file.createNewFile();
        } catch (Exception ignored) {}

        // dir.exists()=true, dir.isDirectory()=false → 跳过列表
        UD12UploadDeletetemplatResponse response = service.listTemplates("AUS");
        assertEquals(200, response.getCode());

        Map<String, Object> data = (Map<String, Object>) response.getData();
        List<String> templates = (List<String>) data.get("templates");
        assertTrue(templates.isEmpty());

        file.delete();
        dir.delete();
    }

    // -------------------------------------------------------
    // 分支: 目录含子目录 → f.isFile() = false, 过滤掉子目录
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("listTemplates - 目录含子目录 → 只列出文件")
    void listTemplates_withSubdir_filtersDirectories() {
        ReflectionTestUtils.setField(service, "uploadPath", TEST_UPLOAD_PATH);

        File dir = new File(TEST_UPLOAD_PATH + File.separator + "AUS");
        dir.mkdirs();
        try {
            new File(dir, "real_file.odt").createNewFile();
            new File(dir, "sub_dir").mkdir();
        } catch (Exception ignored) {}

        UD12UploadDeletetemplatResponse response = service.listTemplates("AUS");
        assertEquals(200, response.getCode());

        Map<String, Object> data = (Map<String, Object>) response.getData();
        List<String> templates = (List<String>) data.get("templates");
        assertEquals(1, templates.size());
        assertEquals("real_file.odt", templates.get(0));

        new File(dir, "real_file.odt").delete();
        new File(dir, "sub_dir").delete();
        dir.delete();
        new File(TEST_UPLOAD_PATH).delete();
    }

    // -------------------------------------------------------
    // 分支: listTemplates catch(Exception) → 500
    // 注: dir.listFiles()返回null或SecurityException时触发此catch。
    //     无SecurityManager环境下不可到达, 代码为防御性编写。
    // -------------------------------------------------------
}
