package com.web.app.test;

import com.web.app.dto.UD20MarketDocumentSettingsRequest;
import com.web.app.dto.UD20MarketDocumentSettingsResponse;
import com.web.app.mapper.UD20MarketDocumentSettingsMapper;
import com.web.app.service.impl.UD20MarketDocumentSettingsServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD20MarketDocumentSettingsServiceImpl 单元测试
 * 覆盖所有分支，达到 100% JaCoCo 覆盖率
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD20MarketDocumentSettingsServiceImpl 单元测试")
class UD20MarketDocumentSettingsServiceImplTest {

    @Mock
    private UD20MarketDocumentSettingsMapper ud201Mapper;

    @InjectMocks
    private UD20MarketDocumentSettingsServiceImpl service;

    private static final String DOCTYPE = "Homologation Certificate";

    @Test
    @DisplayName("doctype 为 null 时应返回400")
    void testUpdate_DoctypeNull() {
        UD20MarketDocumentSettingsResponse response = service.UD20UpdateHdocDocumentList(
                new UD20MarketDocumentSettingsRequest());
        assertEquals(400, response.getCode().intValue());
        assertEquals("Document type不能为空", response.getMsg());
        assertNull(response.getData());
        verify(ud201Mapper, never()).countByDoctype(any());
    }

    @Test
    @DisplayName("doctype 为空字符串时应返回400")
    void testUpdate_DoctypeEmpty() {
        UD20MarketDocumentSettingsRequest request = new UD20MarketDocumentSettingsRequest();
        request.setDoctype("");
        UD20MarketDocumentSettingsResponse response = service.UD20UpdateHdocDocumentList(request);
        assertEquals(400, response.getCode().intValue());
        assertEquals("Document type不能为空", response.getMsg());
        assertNull(response.getData());
        verify(ud201Mapper, never()).countByDoctype(any());
    }

    @Test
    @DisplayName("doctype 为空白字符串时应返回400")
    void testUpdate_DoctypeBlank() {
        UD20MarketDocumentSettingsRequest request = new UD20MarketDocumentSettingsRequest();
        request.setDoctype("   ");
        UD20MarketDocumentSettingsResponse response = service.UD20UpdateHdocDocumentList(request);
        assertEquals(400, response.getCode().intValue());
        assertEquals("Document type不能为空", response.getMsg());
        assertNull(response.getData());
        verify(ud201Mapper, never()).countByDoctype(any());
    }

    @Test
    @DisplayName("count <= 0 时应返回404")
    void testUpdate_CountZero() {
        when(ud201Mapper.countByDoctype(DOCTYPE)).thenReturn(0);

        UD20MarketDocumentSettingsResponse response = service.UD20UpdateHdocDocumentList(createRequest(DOCTYPE));

        assertEquals(404, response.getCode().intValue());
        assertEquals("Document type does not exists. Please enter the correct content.", response.getMsg());
        assertNull(response.getData());
        verify(ud201Mapper, times(1)).countByDoctype(DOCTYPE);
        verify(ud201Mapper, never()).updateDocumentList(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("count 为负数时应返回404")
    void testUpdate_CountNegative() {
        when(ud201Mapper.countByDoctype(DOCTYPE)).thenReturn(-1);

        UD20MarketDocumentSettingsResponse response = service.UD20UpdateHdocDocumentList(createRequest(DOCTYPE));

        assertEquals(404, response.getCode().intValue());
        assertEquals("Document type does not exists. Please enter the correct content.", response.getMsg());
        assertNull(response.getData());
        verify(ud201Mapper, times(1)).countByDoctype(DOCTYPE);
    }

    @Test
    @DisplayName("更新成功且 registerUser 不为空时应使用用户值")
    void testUpdate_SuccessWithUser() {
        when(ud201Mapper.countByDoctype(DOCTYPE)).thenReturn(1);
        when(ud201Mapper.updateDocumentList(eq(DOCTYPE), eq("admin"), any(), any(), any())).thenReturn(1);

        UD20MarketDocumentSettingsResponse response = service.UD20UpdateHdocDocumentList(
                createRequestWithUser(DOCTYPE, "admin"));

        assertEquals(200, response.getCode().intValue());
        assertEquals("保存成功", response.getMsg());
        assertNull(response.getData());
        verify(ud201Mapper, times(1)).countByDoctype(DOCTYPE);
        verify(ud201Mapper, times(1)).updateDocumentList(eq(DOCTYPE), eq("admin"), any(), any(), any());
    }

    @Test
    @DisplayName("更新成功且 registerUser 为 null 时应使用 SYSTEM")
    void testUpdate_SuccessWithSystemUser() {
        when(ud201Mapper.countByDoctype(DOCTYPE)).thenReturn(1);
        when(ud201Mapper.updateDocumentList(eq(DOCTYPE), eq("SYSTEM"), any(), any(), any())).thenReturn(1);

        UD20MarketDocumentSettingsResponse response = service.UD20UpdateHdocDocumentList(createRequest(DOCTYPE));

        assertEquals(200, response.getCode().intValue());
        assertEquals("保存成功", response.getMsg());
        assertNull(response.getData());
        verify(ud201Mapper, times(1)).updateDocumentList(eq(DOCTYPE), eq("SYSTEM"), any(), any(), any());
    }

    @Test
    @DisplayName("更新成功且 registerUser 为空字符串时应使用 SYSTEM")
    void testUpdate_SuccessWithEmptyUser() {
        when(ud201Mapper.countByDoctype(DOCTYPE)).thenReturn(1);
        when(ud201Mapper.updateDocumentList(eq(DOCTYPE), eq("SYSTEM"), any(), any(), any())).thenReturn(1);

        UD20MarketDocumentSettingsResponse response = service.UD20UpdateHdocDocumentList(
                createRequestWithUser(DOCTYPE, ""));

        assertEquals(200, response.getCode().intValue());
        assertEquals("保存成功", response.getMsg());
        assertNull(response.getData());
        verify(ud201Mapper, times(1)).updateDocumentList(eq(DOCTYPE), eq("SYSTEM"), any(), any(), any());
    }

    @Test
    @DisplayName("updatedRows <= 0 时应返回500（更新失败）")
    void testUpdate_UpdatedRowsZero() {
        when(ud201Mapper.countByDoctype(DOCTYPE)).thenReturn(1);
        when(ud201Mapper.updateDocumentList(eq(DOCTYPE), anyString(), any(), any(), any())).thenReturn(0);

        UD20MarketDocumentSettingsResponse response = service.UD20UpdateHdocDocumentList(
                createRequestWithUser(DOCTYPE, "admin"));

        assertEquals(500, response.getCode().intValue());
        assertEquals("更新失败", response.getMsg());
        assertNull(response.getData());
        verify(ud201Mapper, times(1)).updateDocumentList(eq(DOCTYPE), anyString(), any(), any(), any());
    }

    @Test
    @DisplayName("系统异常时应返回500")
    void testUpdate_Exception() {
        when(ud201Mapper.countByDoctype(anyString())).thenThrow(new RuntimeException("数据库异常"));

        UD20MarketDocumentSettingsResponse response = service.UD20UpdateHdocDocumentList(createRequest(DOCTYPE));

        assertEquals(500, response.getCode().intValue());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
        verify(ud201Mapper, times(1)).countByDoctype(DOCTYPE);
    }

    // ==================== 辅助方法 ====================

    private UD20MarketDocumentSettingsRequest createRequest(String doctype) {
        UD20MarketDocumentSettingsRequest request = new UD20MarketDocumentSettingsRequest();
        request.setDoctype(doctype);
        return request;
    }

    private UD20MarketDocumentSettingsRequest createRequestWithUser(String doctype, String registerUser) {
        UD20MarketDocumentSettingsRequest request = new UD20MarketDocumentSettingsRequest();
        request.setDoctype(doctype);
        request.setRegisterUser(registerUser);
        return request;
    }
}
