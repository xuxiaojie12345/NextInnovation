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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UD12UploadDeleteTemplateServiceImplTest {

    @InjectMocks
    private UD12UploadDeleteTemplateServiceImpl service;

    @Mock
    private UD12UploadDeleteTemplateMapper ud12UploadDeleteTemplateMapper;

    @Mock
    private SvnUtil svnUtil;

    @Test
    public void getMarkets_success_returnsMarketList() {
        when(ud12UploadDeleteTemplateMapper.getAllMarkets()).thenReturn(Arrays.asList(new MarketMaster("JPN"), new MarketMaster("CHN")));

        UD12UploadDeleteTemplateResponse response = service.getMarkets();

        assertEquals(200, response.getCode());
        assertEquals("success", response.getMessage());
        assertTrue(((List<?>) response.getData()).size() == 2);
    }

    @Test
    public void getMarkets_success_returnsEmptyList() {
        when(ud12UploadDeleteTemplateMapper.getAllMarkets()).thenReturn(Collections.emptyList());

        UD12UploadDeleteTemplateResponse response = service.getMarkets();

        assertEquals(200, response.getCode());
        assertEquals("success", response.getMessage());
        assertTrue(((List<?>) response.getData()).isEmpty());
    }

    @Test
    public void getMarkets_exceptionReturnsFail() {
        when(ud12UploadDeleteTemplateMapper.getAllMarkets()).thenThrow(new RuntimeException("db error"));

        UD12UploadDeleteTemplateResponse response = service.getMarkets();

        assertEquals(401, response.getCode());
        assertEquals("Failed to load markets", response.getMessage());
        assertNull(response.getData());
    }

    @Test
    public void uploadFile_nullFileReturnsNoFileUploaded() {
        UD12UploadDeleteTemplateResponse response = service.uploadFile(null, "CN");
        assertEquals(401, response.getCode());
        assertEquals("NO FILE UPLOADED", response.getMessage());
    }

    @Test
    public void uploadFile_emptyFileReturnsNoFileUploaded() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(true);

        UD12UploadDeleteTemplateResponse response = service.uploadFile(file, "CN");
        assertEquals(401, response.getCode());
        assertEquals("NO FILE UPLOADED", response.getMessage());
    }

    @Test
    public void uploadFile_nullMarketReturnsPleaseSelectMarket() {
        MockMultipartFile file = new MockMultipartFile("Template File", "template.xlsx", "application/octet-stream", "x".getBytes());

        UD12UploadDeleteTemplateResponse response = service.uploadFile(file, null);
        assertEquals(401, response.getCode());
        assertEquals("Please select a market", response.getMessage());
    }

    @Test
    public void uploadFile_blankMarketReturnsPleaseSelectMarket() {
        MockMultipartFile file = new MockMultipartFile("Template File", "template.xlsx", "application/octet-stream", "x".getBytes());

        UD12UploadDeleteTemplateResponse response = service.uploadFile(file, " ");
        assertEquals(401, response.getCode());
        assertEquals("Please select a market", response.getMessage());
    }

    @Test
    public void uploadFile_fileTooLargeReturnsFail() {
        byte[] content = new byte[11 * 1024 * 1024];
        MockMultipartFile file = new MockMultipartFile("Template File", "template.xlsx", "application/octet-stream", content);

        UD12UploadDeleteTemplateResponse response = service.uploadFile(file, "CN");
        assertEquals(401, response.getCode());
        assertEquals("The file exceeds 10MB, please select again", response.getMessage());
    }

    @Test
    public void uploadFile_originalFilenameNullUsesUnknownFile() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(100L);
        when(file.getOriginalFilename()).thenReturn(null);
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream("x".getBytes()));

        UD12UploadDeleteTemplateResponse response = service.uploadFile(file, "CN");

        assertEquals(200, response.getCode());
        assertEquals("success", response.getMessage());
        verify(svnUtil, times(1)).uploadFile(eq("CN"), any(), eq("unknown_file"));
    }

    @Test
    public void uploadFile_originalFilenameEmptyUsesUnknownFile() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(100L);
        when(file.getOriginalFilename()).thenReturn("");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream("x".getBytes()));

        UD12UploadDeleteTemplateResponse response = service.uploadFile(file, "CN");

        assertEquals(200, response.getCode());
        assertEquals("success", response.getMessage());
        verify(svnUtil, times(1)).uploadFile(eq("CN"), any(), eq("unknown_file"));
    }

    @Test
    public void uploadFile_svnThrowsReturnsFail() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(100L);
        when(file.getOriginalFilename()).thenReturn("template.xlsx");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream("x".getBytes()));
        doThrow(new RuntimeException("svn error")).when(svnUtil).uploadFile(eq("CN"), any(), eq("template.xlsx"));

        UD12UploadDeleteTemplateResponse response = service.uploadFile(file, "CN");

        assertEquals(401, response.getCode());
        assertEquals("File upload faile", response.getMessage());
    }

    @Test
    public void uploadFile_inputStreamThrowsReturnsFail() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(100L);
        when(file.getOriginalFilename()).thenReturn("template.xlsx");
        when(file.getInputStream()).thenThrow(new IOException("io error"));

        UD12UploadDeleteTemplateResponse response = service.uploadFile(file, "CN");

        assertEquals(401, response.getCode());
        assertEquals("File upload faile", response.getMessage());
        verify(svnUtil, times(0)).uploadFile(any(), any(), any());
    }

    @Test
    public void getFileList_nullMarketReturnsFail() {
        UD12UploadDeleteTemplateResponse response = service.getFileList(null);
        assertEquals(401, response.getCode());
        assertEquals("Market is required", response.getMessage());
    }

    @Test
    public void getFileList_blankMarketReturnsFail() {
        UD12UploadDeleteTemplateResponse response = service.getFileList(" ");
        assertEquals(401, response.getCode());
        assertEquals("Market is required", response.getMessage());
    }

    @Test
    public void getFileList_returnsFiles() throws Exception {
        given(svnUtil.listFiles("CN")).willReturn(Arrays.asList("template1.xlsx", "template2.xlsx"));

        UD12UploadDeleteTemplateResponse response = service.getFileList("CN");

        assertEquals(200, response.getCode());
        assertEquals("success", response.getMessage());
        assertEquals(2, ((List<?>) response.getData()).size());
    }

    @Test
    public void getFileList_returnsEmptyList() throws Exception {
        given(svnUtil.listFiles("CN")).willReturn(Collections.emptyList());

        UD12UploadDeleteTemplateResponse response = service.getFileList("CN");

        assertEquals(200, response.getCode());
        assertEquals("success", response.getMessage());
        assertTrue(((List<?>) response.getData()).isEmpty());
    }

    @Test
    public void getFileList_svnThrowsReturnsFail() throws Exception {
        given(svnUtil.listFiles("CN")).willThrow(new RuntimeException("svn error"));

        UD12UploadDeleteTemplateResponse response = service.getFileList("CN");

        assertEquals(401, response.getCode());
        assertEquals("Failed to load templates", response.getMessage());
    }

    @Test
    public void deleteFile_nullMarketReturnsFail() {
        UD12UploadDeleteTemplateResponse response = service.deleteFile("template.xlsx", null);
        assertEquals(401, response.getCode());
        assertEquals("Please select a market", response.getMessage());
    }

    @Test
    public void deleteFile_blankMarketReturnsFail() {
        UD12UploadDeleteTemplateResponse response = service.deleteFile("template.xlsx", " ");
        assertEquals(401, response.getCode());
        assertEquals("Please select a market", response.getMessage());
    }

    @Test
    public void deleteFile_nullTemplateReturnsFail() {
        UD12UploadDeleteTemplateResponse response = service.deleteFile(null, "CN");
        assertEquals(401, response.getCode());
        assertEquals("Please select a template file", response.getMessage());
    }

    @Test
    public void deleteFile_blankTemplateReturnsFail() {
        UD12UploadDeleteTemplateResponse response = service.deleteFile(" ", "CN");
        assertEquals(401, response.getCode());
        assertEquals("Please select a template file", response.getMessage());
    }

    @Test
    public void deleteFile_successReturnsSuccess() throws Exception {
        UD12UploadDeleteTemplateResponse response = service.deleteFile("template.xlsx", "CN");
        assertEquals(200, response.getCode());
        assertEquals("success", response.getMessage());
        verify(svnUtil, times(1)).deleteFile(eq("CN"), eq("template.xlsx"));
    }

    @Test
    public void deleteFile_fileNotFoundReturnsFileNotFound() throws Exception {
        doThrow(new RuntimeException("File not found")).when(svnUtil).deleteFile("CN", "missing.xlsx");

        UD12UploadDeleteTemplateResponse response = service.deleteFile("missing.xlsx", "CN");

        assertEquals(401, response.getCode());
        assertEquals("Failed to delete file: File not found", response.getMessage());
    }

    @Test
    public void deleteFile_otherExceptionReturnsFail() throws Exception {
        doThrow(new RuntimeException("permission denied")).when(svnUtil).deleteFile("CN", "template.xlsx");

        UD12UploadDeleteTemplateResponse response = service.deleteFile("template.xlsx", "CN");

        assertEquals(401, response.getCode());
        assertEquals("File delete faile", response.getMessage());
    }
}
