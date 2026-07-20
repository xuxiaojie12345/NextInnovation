package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD05ModifyDocumentResponse;
import com.web.app.domain.UD05ModifyDocumentSaveRequest;
import com.web.app.mapper.HdocAdcaModificationMapper;
import com.web.app.service.impl.UD05ModifyDocumentServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD05ModifyDocumentServiceImpl 单元测试
 * 覆盖所有分支路径，达到100%分支覆盖率
 */
@ExtendWith(MockitoExtension.class)
class UD05ModifyDocumentServiceImplTest {

    @Mock
    private HdocAdcaModificationMapper hdocAdcaModificationMapper;

    @InjectMocks
    private UD05ModifyDocumentServiceImpl service;

    @Captor
    private ArgumentCaptor<String> chassisSeriesCaptor;

    @Captor
    private ArgumentCaptor<String> chassisNoCaptor;

    @Captor
    private ArgumentCaptor<String> variableCaptor;

    @Captor
    private ArgumentCaptor<String> newvalCaptor;

    @Captor
    private ArgumentCaptor<String> updateUserCaptor;

    // ============================================================
    // getModifyDocument() — validateInitialRequest 参数校验分支
    // ============================================================

    @Test
    @DisplayName("getModifyDocument - chassisSeries为null，应返回400")
    void getModifyDocument_ChassisSeriesNull_ShouldReturn400() {
        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument(null, "ABC123");

        assertEquals(400, result.getCode());
        assertEquals("Chassis series is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("getModifyDocument - chassisSeries为空字符串，应返回400")
    void getModifyDocument_ChassisSeriesEmpty_ShouldReturn400() {
        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument("", "ABC123");

        assertEquals(400, result.getCode());
        assertEquals("Chassis series is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("getModifyDocument - chassisSeries为空白字符串，应返回400")
    void getModifyDocument_ChassisSeriesBlank_ShouldReturn400() {
        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument("   ", "ABC123");

        assertEquals(400, result.getCode());
        assertEquals("Chassis series is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("getModifyDocument - chassisSeries长度不等于4，应返回400")
    void getModifyDocument_ChassisSeriesLengthNot4_ShouldReturn400() {
        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument("ABC", "ABC123");

        assertEquals(400, result.getCode());
        assertEquals("Chassis series must be 4 characters.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("getModifyDocument - chassisNo为null，应返回400")
    void getModifyDocument_ChassisNoNull_ShouldReturn400() {
        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument("ABCD", null);

        assertEquals(400, result.getCode());
        assertEquals("Chassis no is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("getModifyDocument - chassisNo为空字符串，应返回400")
    void getModifyDocument_ChassisNoEmpty_ShouldReturn400() {
        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument("ABCD", "");

        assertEquals(400, result.getCode());
        assertEquals("Chassis no is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("getModifyDocument - chassisNo为空白字符串，应返回400")
    void getModifyDocument_ChassisNoBlank_ShouldReturn400() {
        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument("ABCD", "   ");

        assertEquals(400, result.getCode());
        assertEquals("Chassis no is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("getModifyDocument - chassisNo超过10个字符，应返回400")
    void getModifyDocument_ChassisNoTooLong_ShouldReturn400() {
        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument("ABCD", "12345678901");

        assertEquals(400, result.getCode());
        assertEquals("Chassis no must not exceed 10 characters.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("getModifyDocument - chassisSeries包含非法字符，应返回400")
    void getModifyDocument_ChassisSeriesInvalidChars_ShouldReturn400() {
        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument("AB_D", "123456");

        assertEquals(400, result.getCode());
        assertEquals("Chassis series contains invalid characters.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("getModifyDocument - chassisNo包含非法字符，应返回400")
    void getModifyDocument_ChassisNoInvalidChars_ShouldReturn400() {
        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument("ABCD", "123-456");

        assertEquals(400, result.getCode());
        assertEquals("Chassis no contains invalid characters.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    // ============================================================
    // getModifyDocument() — 数据库查询分支
    // ============================================================

    @Test
    @DisplayName("getModifyDocument - Mapper返回null，应返回成功且variables为空列表")
    void getModifyDocument_VariablesNull_ShouldReturnSuccessWithEmptyList() {
        when(hdocAdcaModificationMapper.selectVariantInfo("ABCD", "123456")).thenReturn(null);

        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument("ABCD", "123456");

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertEquals("", result.getData().getMarket());
        assertEquals("aus/UD_TEST.odt", result.getData().getTemplate());
        assertNotNull(result.getData().getVariables());
        assertTrue(result.getData().getVariables().isEmpty());
        verify(hdocAdcaModificationMapper, times(1)).selectVariantInfo("ABCD", "123456");
    }

    @Test
    @DisplayName("getModifyDocument - Mapper返回空列表，应返回成功且variables为空列表")
    void getModifyDocument_VariablesEmpty_ShouldReturnSuccessWithEmptyList() {
        when(hdocAdcaModificationMapper.selectVariantInfo("ABCD", "123456")).thenReturn(Collections.emptyList());

        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument("ABCD", "123456");

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertNotNull(result.getData().getVariables());
        assertTrue(result.getData().getVariables().isEmpty());
        verify(hdocAdcaModificationMapper, times(1)).selectVariantInfo("ABCD", "123456");
    }

    @Test
    @DisplayName("getModifyDocument - Mapper返回非空列表，应返回成功包含数据")
    void getModifyDocument_VariablesNotEmpty_ShouldReturnSuccessWithData() {
        UD05ModifyDocumentResponse.VariableItem item = UD05ModifyDocumentResponse.VariableItem.builder()
                .variable("VAR001")
                .description("Test Variable")
                .currentValue("OLD")
                .newval("NEW")
                .build();
        when(hdocAdcaModificationMapper.selectVariantInfo("ABCD", "123456")).thenReturn(Arrays.asList(item));

        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument("ABCD", "123456");

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertEquals(1, result.getData().getVariables().size());
        assertEquals("VAR001", result.getData().getVariables().get(0).getVariable());
        verify(hdocAdcaModificationMapper, times(1)).selectVariantInfo("ABCD", "123456");
    }

    @Test
    @DisplayName("getModifyDocument - Mapper抛出异常，应返回500")
    void getModifyDocument_MapperThrowsException_ShouldReturn500() {
        when(hdocAdcaModificationMapper.selectVariantInfo("ABCD", "123456"))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument("ABCD", "123456");

        assertEquals(500, result.getCode());
        assertEquals("System error. Please contact administrator.", result.getMsg());
        verify(hdocAdcaModificationMapper, times(1)).selectVariantInfo("ABCD", "123456");
    }

    // ============================================================
    // saveModifyDocument() — validateSaveRequest 参数校验分支
    // ============================================================

    @Test
    @DisplayName("saveModifyDocument - chassisSeries为null，应返回400")
    void saveModifyDocument_ChassisSeriesNull_ShouldReturn400() {
        UD05ModifyDocumentSaveRequest request = new UD05ModifyDocumentSaveRequest();
        request.setChassisSeries(null);
        request.setChassisNo("123456");
        request.setVariables(Collections.singletonList(new UD05ModifyDocumentSaveRequest.VariableItem()));

        ApiResponse<Void> result = service.saveModifyDocument(request);

        assertEquals(400, result.getCode());
        assertEquals("Chassis series is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("saveModifyDocument - chassisNo为null，应返回400")
    void saveModifyDocument_ChassisNoNull_ShouldReturn400() {
        UD05ModifyDocumentSaveRequest request = new UD05ModifyDocumentSaveRequest();
        request.setChassisSeries("ABCD");
        request.setChassisNo(null);
        request.setVariables(Collections.singletonList(new UD05ModifyDocumentSaveRequest.VariableItem()));

        ApiResponse<Void> result = service.saveModifyDocument(request);

        assertEquals(400, result.getCode());
        assertEquals("Chassis no is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("saveModifyDocument - variables为null，应返回400")
    void saveModifyDocument_VariablesNull_ShouldReturn400() {
        UD05ModifyDocumentSaveRequest request = new UD05ModifyDocumentSaveRequest();
        request.setChassisSeries("ABCD");
        request.setChassisNo("123456");
        request.setVariables(null);

        ApiResponse<Void> result = service.saveModifyDocument(request);

        assertEquals(400, result.getCode());
        assertEquals("Variables list is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("saveModifyDocument - variables为空列表，应返回400")
    void saveModifyDocument_VariablesEmpty_ShouldReturn400() {
        UD05ModifyDocumentSaveRequest request = new UD05ModifyDocumentSaveRequest();
        request.setChassisSeries("ABCD");
        request.setChassisNo("123456");
        request.setVariables(Collections.emptyList());

        ApiResponse<Void> result = service.saveModifyDocument(request);

        assertEquals(400, result.getCode());
        assertEquals("Variables list is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("saveModifyDocument - variable名称为null，应返回400")
    void saveModifyDocument_VariableNameNull_ShouldReturn400() {
        UD05ModifyDocumentSaveRequest request = new UD05ModifyDocumentSaveRequest();
        request.setChassisSeries("ABCD");
        request.setChassisNo("123456");
        UD05ModifyDocumentSaveRequest.VariableItem item = new UD05ModifyDocumentSaveRequest.VariableItem();
        item.setVariable(null);
        item.setNewval("NEWVAL");
        request.setVariables(Collections.singletonList(item));

        ApiResponse<Void> result = service.saveModifyDocument(request);

        assertEquals(400, result.getCode());
        assertEquals("Variable name at index 0 is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("saveModifyDocument - variable名称为空字符串，应返回400")
    void saveModifyDocument_VariableNameEmpty_ShouldReturn400() {
        UD05ModifyDocumentSaveRequest request = new UD05ModifyDocumentSaveRequest();
        request.setChassisSeries("ABCD");
        request.setChassisNo("123456");
        UD05ModifyDocumentSaveRequest.VariableItem item = new UD05ModifyDocumentSaveRequest.VariableItem();
        item.setVariable("");
        item.setNewval("NEWVAL");
        request.setVariables(Collections.singletonList(item));

        ApiResponse<Void> result = service.saveModifyDocument(request);

        assertEquals(400, result.getCode());
        assertEquals("Variable name at index 0 is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("saveModifyDocument - variable名称为空白字符串，应返回400")
    void saveModifyDocument_VariableNameBlank_ShouldReturn400() {
        UD05ModifyDocumentSaveRequest request = new UD05ModifyDocumentSaveRequest();
        request.setChassisSeries("ABCD");
        request.setChassisNo("123456");
        UD05ModifyDocumentSaveRequest.VariableItem item = new UD05ModifyDocumentSaveRequest.VariableItem();
        item.setVariable("   ");
        item.setNewval("NEWVAL");
        request.setVariables(Collections.singletonList(item));

        ApiResponse<Void> result = service.saveModifyDocument(request);

        assertEquals(400, result.getCode());
        assertEquals("Variable name at index 0 is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    // ============================================================
    // saveModifyDocument() — 业务更新逻辑分支
    // ============================================================

    @Test
    @DisplayName("saveModifyDocument - newval有值且updateUser为null，应使用SYSTEM并调用Mapper")
    void saveModifyDocument_NewvalNotEmptyUpdateUserNull_ShouldUseDefaultSystem() {
        // 准备
        UD05ModifyDocumentSaveRequest request = new UD05ModifyDocumentSaveRequest();
        request.setChassisSeries("ABCD");
        request.setChassisNo("123456");
        request.setUpdateUser(null);

        UD05ModifyDocumentSaveRequest.VariableItem item = new UD05ModifyDocumentSaveRequest.VariableItem();
        item.setVariable("VAR001");
        item.setNewval("NEW_VALUE");
        request.setVariables(Collections.singletonList(item));

        // 执行
        ApiResponse<Void> result = service.saveModifyDocument(request);

        // 验证
        assertEquals(200, result.getCode());
        assertEquals("操作成功", result.getMsg());
        verify(hdocAdcaModificationMapper, times(1)).updateNewval("ABCD", "123456", "VAR001", "NEW_VALUE", "SYSTEM");
    }

    @Test
    @DisplayName("saveModifyDocument - newval有值且updateUser有值，应使用指定用户并调用Mapper")
    void saveModifyDocument_NewvalNotEmptyAndUpdateUserProvided_ShouldUseGivenUser() {
        // 准备
        UD05ModifyDocumentSaveRequest request = new UD05ModifyDocumentSaveRequest();
        request.setChassisSeries("ABCD");
        request.setChassisNo("123456");
        request.setUpdateUser("admin");

        UD05ModifyDocumentSaveRequest.VariableItem item = new UD05ModifyDocumentSaveRequest.VariableItem();
        item.setVariable("VAR001");
        item.setNewval("NEW_VALUE");
        request.setVariables(Collections.singletonList(item));

        // 执行
        ApiResponse<Void> result = service.saveModifyDocument(request);

        // 验证
        assertEquals(200, result.getCode());
        verify(hdocAdcaModificationMapper, times(1)).updateNewval("ABCD", "123456", "VAR001", "NEW_VALUE", "admin");
    }

    @Test
    @DisplayName("saveModifyDocument - newval为null，应跳过更新")
    void saveModifyDocument_NewvalNull_ShouldSkipUpdate() {
        // 准备
        UD05ModifyDocumentSaveRequest request = new UD05ModifyDocumentSaveRequest();
        request.setChassisSeries("ABCD");
        request.setChassisNo("123456");
        request.setUpdateUser("admin");

        UD05ModifyDocumentSaveRequest.VariableItem item = new UD05ModifyDocumentSaveRequest.VariableItem();
        item.setVariable("VAR001");
        item.setNewval(null);
        request.setVariables(Collections.singletonList(item));

        // 执行
        ApiResponse<Void> result = service.saveModifyDocument(request);

        // 验证
        assertEquals(200, result.getCode());
        verify(hdocAdcaModificationMapper, never()).updateNewval(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("saveModifyDocument - newval为空字符串，应跳过更新")
    void saveModifyDocument_NewvalEmpty_ShouldSkipUpdate() {
        // 准备
        UD05ModifyDocumentSaveRequest request = new UD05ModifyDocumentSaveRequest();
        request.setChassisSeries("ABCD");
        request.setChassisNo("123456");
        request.setUpdateUser("admin");

        UD05ModifyDocumentSaveRequest.VariableItem item = new UD05ModifyDocumentSaveRequest.VariableItem();
        item.setVariable("VAR001");
        item.setNewval("");
        request.setVariables(Collections.singletonList(item));

        // 执行
        ApiResponse<Void> result = service.saveModifyDocument(request);

        // 验证
        assertEquals(200, result.getCode());
        verify(hdocAdcaModificationMapper, never()).updateNewval(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("saveModifyDocument - newval为空白字符串，应跳过更新")
    void saveModifyDocument_NewvalBlank_ShouldSkipUpdate() {
        // 准备
        UD05ModifyDocumentSaveRequest request = new UD05ModifyDocumentSaveRequest();
        request.setChassisSeries("ABCD");
        request.setChassisNo("123456");
        request.setUpdateUser("admin");

        UD05ModifyDocumentSaveRequest.VariableItem item = new UD05ModifyDocumentSaveRequest.VariableItem();
        item.setVariable("VAR001");
        item.setNewval("   ");
        request.setVariables(Collections.singletonList(item));

        // 执行
        ApiResponse<Void> result = service.saveModifyDocument(request);

        // 验证
        assertEquals(200, result.getCode());
        verify(hdocAdcaModificationMapper, never()).updateNewval(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("saveModifyDocument - 多个变量，部分有值部分无值，应只更新有值的")
    void saveModifyDocument_MultipleVariablesMixed_ShouldUpdateOnlyNonEmptyNewvals() {
        // 准备
        UD05ModifyDocumentSaveRequest request = new UD05ModifyDocumentSaveRequest();
        request.setChassisSeries("ABCD");
        request.setChassisNo("123456");
        request.setUpdateUser("admin");

        UD05ModifyDocumentSaveRequest.VariableItem item1 = new UD05ModifyDocumentSaveRequest.VariableItem();
        item1.setVariable("VAR001");
        item1.setNewval("VAL1");

        UD05ModifyDocumentSaveRequest.VariableItem item2 = new UD05ModifyDocumentSaveRequest.VariableItem();
        item2.setVariable("VAR002");
        item2.setNewval(null);  // 应跳过

        UD05ModifyDocumentSaveRequest.VariableItem item3 = new UD05ModifyDocumentSaveRequest.VariableItem();
        item3.setVariable("VAR003");
        item3.setNewval("VAL3");

        request.setVariables(Arrays.asList(item1, item2, item3));

        // 执行
        ApiResponse<Void> result = service.saveModifyDocument(request);

        // 验证
        assertEquals(200, result.getCode());
        verify(hdocAdcaModificationMapper, times(1)).updateNewval("ABCD", "123456", "VAR001", "VAL1", "admin");
        verify(hdocAdcaModificationMapper, times(1)).updateNewval("ABCD", "123456", "VAR003", "VAL3", "admin");
        verify(hdocAdcaModificationMapper, never()).updateNewval(any(), any(), eq("VAR002"), any(), any());
        verify(hdocAdcaModificationMapper, times(2)).updateNewval(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("saveModifyDocument - Mapper抛出异常，应返回500")
    void saveModifyDocument_MapperThrowsException_ShouldReturn500() {
        // 准备
        UD05ModifyDocumentSaveRequest request = new UD05ModifyDocumentSaveRequest();
        request.setChassisSeries("ABCD");
        request.setChassisNo("123456");
        request.setUpdateUser("admin");

        UD05ModifyDocumentSaveRequest.VariableItem item = new UD05ModifyDocumentSaveRequest.VariableItem();
        item.setVariable("VAR001");
        item.setNewval("NEWVAL");
        request.setVariables(Collections.singletonList(item));

        when(hdocAdcaModificationMapper.updateNewval("ABCD", "123456", "VAR001", "NEWVAL", "admin"))
                .thenThrow(new RuntimeException("Update failed"));

        // 执行
        ApiResponse<Void> result = service.saveModifyDocument(request);

        // 验证
        assertEquals(500, result.getCode());
        assertEquals("System error. Please contact administrator.", result.getMsg());
        verify(hdocAdcaModificationMapper, times(1)).updateNewval("ABCD", "123456", "VAR001", "NEWVAL", "admin");
    }
}
