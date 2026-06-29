package com.web.app.test;

import com.web.app.dto.UD12UploadDeleteTemplateResponse;
import com.web.app.entity.MarketMaster;
import com.web.app.mapper.UD12UploadDeleteTemplateMapper;
import com.web.app.service.impl.UD12UploadDeleteTemplateServiceImpl;
import com.web.app.tool.SvnUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
public class UD12TestDemo {

    @InjectMocks
    private UD12UploadDeleteTemplateServiceImpl service;

    @Mock
    private UD12UploadDeleteTemplateMapper ud12UploadDeleteTemplateMapper;

    @Mock
    private SvnUtil svnUtil;

    @Test
    public void getMarkets_success_and_exception() {
        List<MarketMaster> marketMasters = Arrays.asList(new MarketMaster("JPN"), new MarketMaster("CHN"));
        when(ud12UploadDeleteTemplateMapper.getAllMarkets()).thenReturn(marketMasters);

        UD12UploadDeleteTemplateResponse r1 = service.getMarkets();
        assertEquals(200, r1.getCode());
        assertEquals("success", r1.getMessage());
        assertTrue(((List<?>) r1.getData()).size() == 2);

        when(ud12UploadDeleteTemplateMapper.getAllMarkets()).thenThrow(new RuntimeException("db"));
        UD12UploadDeleteTemplateResponse r2 = service.getMarkets();
        assertEquals(401, r2.getCode());
        assertEquals("Failed to load markets", r2.getMessage());
        assertNull(r2.getData());
    }

    @Test
    public void uploadFile_all_branches() throws Exception {
        // null file
        UD12UploadDeleteTemplateResponse r1 = service.uploadFile(null, "CN");
        assertEquals(401, r1.getCode());
        assertEquals("NO FILE UPLOADED", r1.getMessage());

        // empty file
        MultipartFile empty = mock(MultipartFile.class);
        when(empty.isEmpty()).thenReturn(true);
        UD12UploadDeleteTemplateResponse r2 = service.uploadFile(empty, "CN");
        assertEquals(401, r2.getCode());
        assertEquals("NO FILE UPLOADED", r2.getMessage());

        // market blank
        MockMultipartFile small = new MockMultipartFile("Template File", "t.xlsx", "application/octet-stream", "x".getBytes());
        UD12UploadDeleteTemplateResponse r3 = service.uploadFile(small, " ");
        assertEquals(401, r3.getCode());
        assertEquals("Please select a market", r3.getMessage());

        // market null
        MockMultipartFile smalla = new MockMultipartFile("Template File", "t.xlsx", "application/octet-stream", "x".getBytes());
        UD12UploadDeleteTemplateResponse r8 = service.uploadFile(smalla, null);
        assertEquals(401, r8.getCode());
        assertEquals("Please select a market", r8.getMessage());

        // too large
        byte[] big = new byte[11 * 1024 * 1024];
        MockMultipartFile bigFile = new MockMultipartFile("Template File", "t.xlsx", "application/octet-stream", big);
        UD12UploadDeleteTemplateResponse r4 = service.uploadFile(bigFile, "CN");
        assertEquals(401, r4.getCode());
        assertEquals("The file exceeds 10MB, please select again", r4.getMessage());

        // originalFilename null -> uses unknown_file and succeeds
        MultipartFile fileNullName = mock(MultipartFile.class);
        when(fileNullName.isEmpty()).thenReturn(false);
        when(fileNullName.getSize()).thenReturn(10L);
        when(fileNullName.getOriginalFilename()).thenReturn(null);
        when(fileNullName.getInputStream()).thenReturn(new ByteArrayInputStream("x".getBytes()));

        UD12UploadDeleteTemplateResponse r5 = service.uploadFile(fileNullName, "CN");
        assertEquals(200, r5.getCode());
        assertEquals("success", r5.getMessage());
        verify(svnUtil).uploadFile(eq("CN"), any(), eq("unknown_file"));

        // originalFilename empty string -> uses unknown_file and succeeds
        MultipartFile fileEmptyName = mock(MultipartFile.class);
        when(fileEmptyName.isEmpty()).thenReturn(false);
        when(fileEmptyName.getSize()).thenReturn(10L);
        when(fileEmptyName.getOriginalFilename()).thenReturn("");
        when(fileEmptyName.getInputStream()).thenReturn(new ByteArrayInputStream("x".getBytes()));

        UD12UploadDeleteTemplateResponse r5b = service.uploadFile(fileEmptyName, "CN");
        assertEquals(200, r5b.getCode());
        assertEquals("success", r5b.getMessage());
        verify(svnUtil, org.mockito.Mockito.times(2)).uploadFile(eq("CN"), any(), eq("unknown_file"));

        // svn throws
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(10L);
        when(file.getOriginalFilename()).thenReturn("f.xlsx");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream("x".getBytes()));
        doThrow(new RuntimeException("svn err")).when(svnUtil).uploadFile(eq("CN"), any(), eq("f.xlsx"));

        UD12UploadDeleteTemplateResponse r6 = service.uploadFile(file, "CN");
        assertEquals(401, r6.getCode());
        assertEquals("File upload faile", r6.getMessage());

        // inputstream throws -> fail and svn not called
        MultipartFile fileIsThrow = mock(MultipartFile.class);
        when(fileIsThrow.isEmpty()).thenReturn(false);
        when(fileIsThrow.getSize()).thenReturn(10L);
        when(fileIsThrow.getOriginalFilename()).thenReturn("g.xlsx");
        when(fileIsThrow.getInputStream()).thenThrow(new IOException("io"));

        UD12UploadDeleteTemplateResponse r7 = service.uploadFile(fileIsThrow, "CN");
        assertEquals(401, r7.getCode());
        assertEquals("File upload faile", r7.getMessage());
        // ensure svn upload not called for this failing case
        verify(svnUtil, never()).uploadFile(eq("CN"), any(), eq("g.xlsx"));
    }

    @Test
    public void getFileList_all_branches() throws Exception {
        // market blank
        UD12UploadDeleteTemplateResponse r1 = service.getFileList(" ");
        assertEquals(401, r1.getCode());
        assertEquals("Market is required", r1.getMessage());

        // market null
        UD12UploadDeleteTemplateResponse r1b = service.getFileList(null);
        assertEquals(401, r1b.getCode());
        assertEquals("Market is required", r1b.getMessage());

        // svn returns files
        given(svnUtil.listFiles("CN")).willReturn(Arrays.asList("a.xlsx", "b.xlsx"));
        UD12UploadDeleteTemplateResponse r2 = service.getFileList("CN");
        assertEquals(200, r2.getCode());
        List<?> files = (List<?>) r2.getData();
        assertEquals(2, files.size());

        // svn returns empty
        given(svnUtil.listFiles("CN")).willReturn(Collections.emptyList());
        UD12UploadDeleteTemplateResponse r3 = service.getFileList("CN");
        assertEquals(200, r3.getCode());
        List<?> files2 = (List<?>) r3.getData();
        assertEquals(0, files2.size());

        // svn throws
        given(svnUtil.listFiles("CN")).willThrow(new RuntimeException("svn"));
        UD12UploadDeleteTemplateResponse r4 = service.getFileList("CN");
        assertEquals(401, r4.getCode());
        assertEquals("Failed to load templates", r4.getMessage());
    }

    @Test
    public void deleteFile_all_branches() throws Exception {
        // market blank
        UD12UploadDeleteTemplateResponse r1 = service.deleteFile("t.xlsx", " ");
        assertEquals(401, r1.getCode());
        assertEquals("Please select a market", r1.getMessage());

        // market null
        UD12UploadDeleteTemplateResponse r1b = service.deleteFile("t.xlsx", null);
        assertEquals(401, r1b.getCode());
        assertEquals("Please select a market", r1b.getMessage());

        // template blank
        UD12UploadDeleteTemplateResponse r2 = service.deleteFile(" ", "CN");
        assertEquals(401, r2.getCode());
        assertEquals("Please select a template file", r2.getMessage());

        // template null
        UD12UploadDeleteTemplateResponse r2b = service.deleteFile(null, "CN");
        assertEquals(401, r2b.getCode());
        assertEquals("Please select a template file", r2b.getMessage());

        // success
        UD12UploadDeleteTemplateResponse r3 = service.deleteFile("t.xlsx", "CN");
        assertEquals(200, r3.getCode());
        assertEquals("success", r3.getMessage());
        verify(svnUtil).deleteFile(eq("CN"), eq("t.xlsx"));

        // file not found
        doThrow(new RuntimeException("File not found")).when(svnUtil).deleteFile("CN", "x.xlsx");
        UD12UploadDeleteTemplateResponse r4 = service.deleteFile("x.xlsx", "CN");
        assertEquals(401, r4.getCode());
        assertEquals("Failed to delete file: File not found", r4.getMessage());

        // other exception
        doThrow(new RuntimeException("perm")).when(svnUtil).deleteFile("CN", "y.xlsx");
        UD12UploadDeleteTemplateResponse r5 = service.deleteFile("y.xlsx", "CN");
        assertEquals(401, r5.getCode());
        assertEquals("File delete faile", r5.getMessage());
    }
}
