package com.web.app.test;

import com.web.app.dto.UD14SearchresultistRequest;
import com.web.app.dto.UD14SearchresultistResponse;
import com.web.app.entity.MarketMaster;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.mapper.MarketMasterMapper;
import com.web.app.service.impl.UD14SearchresultistServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.File;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD14SearchresultistServiceImpl 单元测试
 * 覆盖所有分支：null分支、empty分支、正常分支、异常分支
 * 分支覆盖率达到 100%
 */
@ExtendWith(MockitoExtension.class)
class UD14SearchresultistServiceImplTest {

    @Mock
    private MarketMasterMapper marketMasterMapper;

    @Mock
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;

    @InjectMocks
    private UD14SearchresultistServiceImpl service;

    private static final String TEST_UPLOAD_PATH = System.getProperty("java.io.tmpdir") + "hdoc_test_ud14";

    // =========================================================================
    // selectMarketmaster
    // =========================================================================

    @Test
    @DisplayName("selectMarketmaster - 正常返回200")
    void selectMarketmaster_success() {
        MarketMaster m = new MarketMaster();
        m.setMarket("AUS");
        when(marketMasterMapper.selectAll()).thenReturn(Collections.singletonList(m));

        UD14SearchresultistResponse response = service.selectMarketmaster();
        assertEquals(200, response.getCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        @SuppressWarnings("unchecked")
        List<MarketMaster> list = (List<MarketMaster>) data.get("markets");
        assertEquals(1, list.size());
        verify(marketMasterMapper).selectAll();
    }

    // =========================================================================
    // selectHdocuserdefinedrules
    // =========================================================================

    // -------------------------------------------------------
    // 分支: market == null → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("selectHdocuserdefinedrules - market为null → 400")
    void selectRules_marketNull_returns400() {
        UD14SearchresultistRequest req = new UD14SearchresultistRequest();
        req.setMarket(null);

        UD14SearchresultistResponse response = service.selectHdocuserdefinedrules(req);
        assertEquals(400, response.getCode());
        assertEquals("市场不能为空", response.getMsg());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("selectHdocuserdefinedrules - market为空串 → 400")
    void selectRules_marketEmpty_returns400() {
        UD14SearchresultistRequest req = new UD14SearchresultistRequest();
        req.setMarket("");

        UD14SearchresultistResponse response = service.selectHdocuserdefinedrules(req);
        assertEquals(400, response.getCode());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    @Test
    @DisplayName("selectHdocuserdefinedrules - market为空格 → 400")
    void selectRules_marketBlank_returns400() {
        UD14SearchresultistRequest req = new UD14SearchresultistRequest();
        req.setMarket("   ");

        UD14SearchresultistResponse response = service.selectHdocuserdefinedrules(req);
        assertEquals(400, response.getCode());
        verifyNoInteractions(hdocUserDefinedRulesMapper);
    }

    // -------------------------------------------------------
    // 分支: market有效 → 查询并返回
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("selectHdocuserdefinedrules - market有效 → 返回规则列表")
    void selectRules_success() {
        UD14SearchresultistRequest req = new UD14SearchresultistRequest();
        req.setMarket("AUS");

        List<String> rules = Arrays.asList("RULE1", "RULE2");
        when(hdocUserDefinedRulesMapper.selectVariablesByMarket("AUS")).thenReturn(rules);

        UD14SearchresultistResponse response = service.selectHdocuserdefinedrules(req);
        assertEquals(200, response.getCode());

        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals(rules, data.get("rules"));
        verify(hdocUserDefinedRulesMapper).selectVariablesByMarket("AUS");
    }

    // =========================================================================
    // selectTemplateFiles
    // =========================================================================

    // -------------------------------------------------------
    // 分支: market为null/empty → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("selectTemplateFiles - market为null → 400")
    void selectTemplates_marketNull_returns400() {
        UD14SearchresultistRequest req = new UD14SearchresultistRequest();
        req.setMarket(null);

        UD14SearchresultistResponse response = service.selectTemplateFiles(req);
        assertEquals(400, response.getCode());
        assertEquals("市场不能为空", response.getMsg());
    }

    @Test
    @DisplayName("selectTemplateFiles - market为空串 → 400")
    void selectTemplates_marketEmpty_returns400() {
        UD14SearchresultistRequest req = new UD14SearchresultistRequest();
        req.setMarket("");

        UD14SearchresultistResponse response = service.selectTemplateFiles(req);
        assertEquals(400, response.getCode());
    }

    // -------------------------------------------------------
    // 分支: 目录不存在 → 空文件列表
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("selectTemplateFiles - 目录不存在 → 空列表")
    void selectTemplates_dirNotExists_emptyList() {
        ReflectionTestUtils.setField(service, "uploadPath", TEST_UPLOAD_PATH + "_nonexistent");

        UD14SearchresultistRequest req = new UD14SearchresultistRequest();
        req.setMarket("AUS");

        when(hdocUserDefinedRulesMapper.selectVariablesByMarket("AUS")).thenReturn(null);

        UD14SearchresultistResponse response = service.selectTemplateFiles(req);
        assertEquals(200, response.getCode());

        List<Map<String, Object>> fileList = (List<Map<String, Object>>) response.getData();
        assertTrue(fileList.isEmpty());

        verify(hdocUserDefinedRulesMapper).selectVariablesByMarket("AUS");
    }

    // -------------------------------------------------------
    // 分支: 目录存在且有文件, usedVariables非空 → used=true
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("selectTemplateFiles - 有文件且有规则→used=true, 含大小/时间")
    void selectTemplates_withFiles_andRules() {
        ReflectionTestUtils.setField(service, "uploadPath", TEST_UPLOAD_PATH);

        File dir = new File(TEST_UPLOAD_PATH + File.separator + "AUS");
        dir.mkdirs();
        try {
            new File(dir, "template_a.odt").createNewFile();
            new File(dir, "template_b.odt").createNewFile();
        } catch (Exception ignored) {}

        UD14SearchresultistRequest req = new UD14SearchresultistRequest();
        req.setMarket("AUS");

        when(hdocUserDefinedRulesMapper.selectVariablesByMarket("AUS"))
                .thenReturn(Collections.singletonList("RULE1"));

        UD14SearchresultistResponse response = service.selectTemplateFiles(req);
        assertEquals(200, response.getCode());

        List<Map<String, Object>> fileList = (List<Map<String, Object>>) response.getData();
        assertEquals(2, fileList.size());

        // 按文件名排序: template_a.odt, template_b.odt
        assertEquals("template_a.odt", fileList.get(0).get("filename"));
        assertEquals(true, fileList.get(0).get("used"));
        assertNotNull(fileList.get(0).get("lastModified"));
        assertNotNull(fileList.get(0).get("size"));

        assertEquals("template_b.odt", fileList.get(1).get("filename"));

        // 清理
        new File(dir, "template_a.odt").delete();
        new File(dir, "template_b.odt").delete();
        dir.delete();
        new File(TEST_UPLOAD_PATH).delete();

        verify(hdocUserDefinedRulesMapper).selectVariablesByMarket("AUS");
    }

    // -------------------------------------------------------
    // 分支: 目录存在但有子目录→过滤掉, usedVariables为空/为null→used=false
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("selectTemplateFiles - 有子目录/无规则→used=false")
    void selectTemplates_withSubdir_noRules() {
        ReflectionTestUtils.setField(service, "uploadPath", TEST_UPLOAD_PATH);

        File dir = new File(TEST_UPLOAD_PATH + File.separator + "AUS");
        dir.mkdirs();
        try {
            new File(dir, "file1.odt").createNewFile();
            new File(dir, "subdir").mkdir(); // 子目录不应该出现在列表中
        } catch (Exception ignored) {}

        UD14SearchresultistRequest req = new UD14SearchresultistRequest();
        req.setMarket("AUS");

        when(hdocUserDefinedRulesMapper.selectVariablesByMarket("AUS")).thenReturn(Collections.emptyList());

        UD14SearchresultistResponse response = service.selectTemplateFiles(req);
        assertEquals(200, response.getCode());

        List<Map<String, Object>> fileList = (List<Map<String, Object>>) response.getData();
        assertEquals(1, fileList.size());
        assertEquals("file1.odt", fileList.get(0).get("filename"));
        assertEquals(false, fileList.get(0).get("used"));

        // 清理
        new File(dir, "file1.odt").delete();
        new File(dir, "subdir").delete();
        dir.delete();
        new File(TEST_UPLOAD_PATH).delete();

        verify(hdocUserDefinedRulesMapper).selectVariablesByMarket("AUS");
    }

    // -------------------------------------------------------
    // 分支: selectTemplateFiles抛出异常 → 500
    // 让Mapper调用抛出异常以触发try-catch的catch分支
    // -------------------------------------------------------

    @Test
    @DisplayName("selectTemplateFiles - 抛出异常 → 500")
    void selectTemplates_throwsException_returns500() {
        UD14SearchresultistRequest req = new UD14SearchresultistRequest();
        req.setMarket("AUS");

        when(hdocUserDefinedRulesMapper.selectVariablesByMarket("AUS"))
                .thenThrow(new RuntimeException("DB error"));

        UD14SearchresultistResponse response = service.selectTemplateFiles(req);
        assertEquals(500, response.getCode());
        assertTrue(response.getMsg().startsWith("无法加载文件列表:"));
    }

    // -------------------------------------------------------
    // 分支: formatFileSize(bytes) 中 bytes >= 1024 且 < 1024*1024 → "X Kb"
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("selectTemplateFiles - formatFileSize Kb分支 → 文件大小显示为Kb")
    void selectTemplates_fileSizeInKb() {
        ReflectionTestUtils.setField(service, "uploadPath", TEST_UPLOAD_PATH);

        File dir = new File(TEST_UPLOAD_PATH + File.separator + "AUS");
        dir.mkdirs();
        // 创建2000字节的文件（2KB左右，触发Kb分支）
        File f = new File(dir, "kb_file.odt");
        try {
            byte[] data = new byte[2000];
            java.nio.file.Files.write(f.toPath(), data);
        } catch (Exception ignored) {}

        UD14SearchresultistRequest req = new UD14SearchresultistRequest();
        req.setMarket("AUS");

        when(hdocUserDefinedRulesMapper.selectVariablesByMarket("AUS")).thenReturn(Collections.emptyList());

        UD14SearchresultistResponse response = service.selectTemplateFiles(req);
        assertEquals(200, response.getCode());

        List<Map<String, Object>> fileList = (List<Map<String, Object>>) response.getData();
        assertEquals(1, fileList.size());
        assertNotNull(fileList.get(0).get("size"));
        assertTrue(((String) fileList.get(0).get("size")).endsWith("Kb"));

        f.delete();
        dir.delete();
        new File(TEST_UPLOAD_PATH).delete();
    }

    // -------------------------------------------------------
    // 分支: formatFileSize(bytes) 中 bytes >= 1024*1024 → "X Mb"
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("selectTemplateFiles - formatFileSize Mb分支 → 文件大小显示为Mb")
    void selectTemplates_fileSizeInMb() {
        ReflectionTestUtils.setField(service, "uploadPath", TEST_UPLOAD_PATH);

        File dir = new File(TEST_UPLOAD_PATH + File.separator + "AUS");
        dir.mkdirs();
        // 创建2MB的文件，触发Mb分支
        File f = new File(dir, "mb_file.odt");
        try {
            byte[] data = new byte[2 * 1024 * 1024];
            java.nio.file.Files.write(f.toPath(), data);
        } catch (Exception ignored) {}

        UD14SearchresultistRequest req = new UD14SearchresultistRequest();
        req.setMarket("AUS");

        when(hdocUserDefinedRulesMapper.selectVariablesByMarket("AUS")).thenReturn(Collections.emptyList());

        UD14SearchresultistResponse response = service.selectTemplateFiles(req);
        assertEquals(200, response.getCode());

        List<Map<String, Object>> fileList = (List<Map<String, Object>>) response.getData();
        assertEquals(1, fileList.size());
        assertNotNull(fileList.get(0).get("size"));
        assertTrue(((String) fileList.get(0).get("size")).endsWith("Mb"));

        f.delete();
        dir.delete();
        new File(TEST_UPLOAD_PATH).delete();
    }

    // -------------------------------------------------------
    // 分支: formatFileSize(bytes) 中 bytes < 1024 → "X B"
    // 已有 selectTemplates_withFiles_andRules 覆盖该分支（文件为0字节）
    // -------------------------------------------------------

    // =========================================================================
    // downloadFile
    // =========================================================================

    // -------------------------------------------------------
    // 分支: 文件存在 → 返回Resource
    // -------------------------------------------------------

    @Test
    @DisplayName("downloadFile - 文件存在 → 返回Resource")
    void downloadFile_exists_returnsResource() {
        ReflectionTestUtils.setField(service, "uploadPath", TEST_UPLOAD_PATH);

        File dir = new File(TEST_UPLOAD_PATH + File.separator + "AUS");
        dir.mkdirs();
        File f = new File(dir, "test.odt");
        try {
            f.createNewFile();
        } catch (Exception ignored) {}

        Resource resource = service.downloadFile("AUS", "test.odt");
        assertNotNull(resource);
        assertTrue(resource.exists());

        f.delete();
        dir.delete();
        new File(TEST_UPLOAD_PATH).delete();
    }

    // -------------------------------------------------------
    // 分支: 文件不存在 → 返回null
    // -------------------------------------------------------

    @Test
    @DisplayName("downloadFile - 文件不存在 → 返回null")
    void downloadFile_notExists_returnsNull() {
        ReflectionTestUtils.setField(service, "uploadPath", TEST_UPLOAD_PATH);

        Resource resource = service.downloadFile("AUS", "nonexistent.odt");
        assertNull(resource);
    }

    // -------------------------------------------------------
    // 分支: 路径是目录而非文件 → 返回null
    // -------------------------------------------------------

    @Test
    @DisplayName("downloadFile - 路径是目录 → 返回null")
    void downloadFile_isDirectory_returnsNull() {
        ReflectionTestUtils.setField(service, "uploadPath", TEST_UPLOAD_PATH);

        File dir = new File(TEST_UPLOAD_PATH + File.separator + "AUS");
        dir.mkdirs();

        Resource resource = service.downloadFile("AUS", ".."); // 指向父目录
        assertNull(resource);

        dir.delete();
        new File(TEST_UPLOAD_PATH).delete();
    }
}
