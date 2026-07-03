package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD05ModifyDocumentResponse;
import com.web.app.domain.UD05ModifyDocumentSaveRequest;
import com.web.app.mapper.HdocAdcaModificationMapper;
import com.web.app.service.impl.UD05ModifyDocumentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
 *
 * 覆盖所有分支（100%覆盖率）
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD05ModifyDocumentServiceImpl 单元测试")
class UD05ModifyDocumentServiceImplTest {

    @Mock
    private HdocAdcaModificationMapper hdocAdcaModificationMapper;

    @InjectMocks
    private UD05ModifyDocumentServiceImpl service;

    private static final String VALID_SERIE = "JPCT";
    private static final String VALID_CHNO = "013945";
    private static final String VAR_NAME = "AXLE_CONF3";
    private static final String NEW_VAL = "555";

    private UD05ModifyDocumentResponse.VariableItem mockVarItem;

    @BeforeEach
    void setUp() {
        reset(hdocAdcaModificationMapper);

        mockVarItem = UD05ModifyDocumentResponse.VariableItem.builder()
                .variable(VAR_NAME)
                .description("Axle Configuration")
                .currentValue("444")
                .newval(NEW_VAL)
                .build();
    }

    // ============================================================
    // getModifyDocument - validateInitialRequest 分支测试
    // ============================================================

    @Test
    @DisplayName("getModifyDocument-ChassisSeries为null-返回400")
    void testGetModifyDocument_ChassisSeriesNull() {
        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument(null, VALID_CHNO);
        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis series is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("getModifyDocument-ChassisSeries为空字符串-返回400")
    void testGetModifyDocument_ChassisSeriesEmpty() {
        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument("", VALID_CHNO);
        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis series is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("getModifyDocument-ChassisSeries长度不为4-返回400")
    void testGetModifyDocument_ChassisSeriesLengthNot4() {
        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument("JPC", VALID_CHNO);
        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis series must be 4 characters.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("getModifyDocument-ChassisNo为null-返回400")
    void testGetModifyDocument_ChassisNoNull() {
        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument(VALID_SERIE, null);
        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis no is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("getModifyDocument-ChassisNo为空字符串-返回400")
    void testGetModifyDocument_ChassisNoEmpty() {
        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument(VALID_SERIE, "");
        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis no is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("getModifyDocument-ChassisNo超过10字符-返回400")
    void testGetModifyDocument_ChassisNoExceedsMaxLength() {
        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument(VALID_SERIE, "01234567890");
        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis no must not exceed 10 characters.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("getModifyDocument-ChassisSeries含非法字符-返回400")
    void testGetModifyDocument_ChassisSeriesInvalidChars() {
        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument("JP_T", VALID_CHNO);
        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis series contains invalid characters.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("getModifyDocument-ChassisNo含非法字符-返回400")
    void testGetModifyDocument_ChassisNoInvalidChars() {
        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument(VALID_SERIE, "0139_5");
        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis no contains invalid characters.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    // ============================================================
    // getModifyDocument - 数据库查询分支测试
    // ============================================================

    @Test
    @DisplayName("getModifyDocument-Mapper返回null列表-返回200空列表")
    void testGetModifyDocument_VariablesNull() {
        when(hdocAdcaModificationMapper.selectVariantInfo(VALID_SERIE, VALID_CHNO))
                .thenReturn(null);

        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument(VALID_SERIE, VALID_CHNO);

        assertEquals(200, result.getCode().intValue());
        assertNotNull(result.getData());
        assertNotNull(result.getData().getVariables());
        assertTrue(result.getData().getVariables().isEmpty());

        verify(hdocAdcaModificationMapper, times(1))
                .selectVariantInfo(VALID_SERIE, VALID_CHNO);
    }

    @Test
    @DisplayName("getModifyDocument-Mapper返回空列表-返回200空列表")
    void testGetModifyDocument_VariablesEmpty() {
        when(hdocAdcaModificationMapper.selectVariantInfo(VALID_SERIE, VALID_CHNO))
                .thenReturn(new ArrayList<>());

        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument(VALID_SERIE, VALID_CHNO);

        assertEquals(200, result.getCode().intValue());
        assertNotNull(result.getData());
        assertNotNull(result.getData().getVariables());
        assertTrue(result.getData().getVariables().isEmpty());

        verify(hdocAdcaModificationMapper, times(1))
                .selectVariantInfo(VALID_SERIE, VALID_CHNO);
    }

    @Test
    @DisplayName("getModifyDocument-查询成功-返回200含数据")
    void testGetModifyDocument_Success() {
        List<UD05ModifyDocumentResponse.VariableItem> varList = Collections.singletonList(mockVarItem);
        when(hdocAdcaModificationMapper.selectVariantInfo(VALID_SERIE, VALID_CHNO))
                .thenReturn(varList);

        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument(VALID_SERIE, VALID_CHNO);

        assertEquals(200, result.getCode().intValue());
        assertNotNull(result.getData());
        assertEquals(1, result.getData().getVariables().size());
        assertEquals(VAR_NAME, result.getData().getVariables().get(0).getVariable());

        verify(hdocAdcaModificationMapper, times(1))
                .selectVariantInfo(VALID_SERIE, VALID_CHNO);
    }

    @Test
    @DisplayName("getModifyDocument-Mapper抛出异常-返回500")
    void testGetModifyDocument_Exception() {
        when(hdocAdcaModificationMapper.selectVariantInfo(VALID_SERIE, VALID_CHNO))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<UD05ModifyDocumentResponse> result = service.getModifyDocument(VALID_SERIE, VALID_CHNO);

        assertEquals(500, result.getCode().intValue());
        assertEquals("System error. Please contact administrator.", result.getMsg());

        verify(hdocAdcaModificationMapper, times(1))
                .selectVariantInfo(VALID_SERIE, VALID_CHNO);
    }

    // ============================================================
    // saveModifyDocument - validateSaveRequest 分支测试
    // ============================================================

    @Test
    @DisplayName("saveModifyDocument-基础校验失败-返回400")
    void testSaveModifyDocument_BaseValidationFails() {
        UD05ModifyDocumentSaveRequest req = new UD05ModifyDocumentSaveRequest();
        req.setChassisSeries(null);
        req.setChassisNo(VALID_CHNO);

        ApiResponse<Void> result = service.saveModifyDocument(req);
        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis series is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("saveModifyDocument-Variables列表为null-返回400")
    void testSaveModifyDocument_VariablesNull() {
        UD05ModifyDocumentSaveRequest req = new UD05ModifyDocumentSaveRequest();
        req.setChassisSeries(VALID_SERIE);
        req.setChassisNo(VALID_CHNO);
        req.setVariables(null);

        ApiResponse<Void> result = service.saveModifyDocument(req);
        assertEquals(400, result.getCode().intValue());
        assertEquals("Variables list is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("saveModifyDocument-Variables列表为空-返回400")
    void testSaveModifyDocument_VariablesEmpty() {
        UD05ModifyDocumentSaveRequest req = new UD05ModifyDocumentSaveRequest();
        req.setChassisSeries(VALID_SERIE);
        req.setChassisNo(VALID_CHNO);
        req.setVariables(new ArrayList<>());

        ApiResponse<Void> result = service.saveModifyDocument(req);
        assertEquals(400, result.getCode().intValue());
        assertEquals("Variables list is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("saveModifyDocument-Variable名称为null-返回400")
    void testSaveModifyDocument_VariableNameNull() {
        UD05ModifyDocumentSaveRequest req = new UD05ModifyDocumentSaveRequest();
        req.setChassisSeries(VALID_SERIE);
        req.setChassisNo(VALID_CHNO);

        UD05ModifyDocumentSaveRequest.VariableItem item = new UD05ModifyDocumentSaveRequest.VariableItem();
        item.setVariable(null);
        item.setNewval(NEW_VAL);
        req.setVariables(Collections.singletonList(item));

        ApiResponse<Void> result = service.saveModifyDocument(req);
        assertEquals(400, result.getCode().intValue());
        assertEquals("Variable name at index 0 is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("saveModifyDocument-Variable名称为空-返回400")
    void testSaveModifyDocument_VariableNameEmpty() {
        UD05ModifyDocumentSaveRequest req = new UD05ModifyDocumentSaveRequest();
        req.setChassisSeries(VALID_SERIE);
        req.setChassisNo(VALID_CHNO);

        UD05ModifyDocumentSaveRequest.VariableItem item = new UD05ModifyDocumentSaveRequest.VariableItem();
        item.setVariable("");
        item.setNewval(NEW_VAL);
        req.setVariables(Collections.singletonList(item));

        ApiResponse<Void> result = service.saveModifyDocument(req);
        assertEquals(400, result.getCode().intValue());
        assertEquals("Variable name at index 0 is required.", result.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    // ============================================================
    // saveModifyDocument - 更新处理分支测试
    // ============================================================

    @Test
    @DisplayName("saveModifyDocument-更新成功-结果大于0-计数增加")
    void testSaveModifyDocument_UpdateSuccess() {
        UD05ModifyDocumentSaveRequest req = new UD05ModifyDocumentSaveRequest();
        req.setChassisSeries(VALID_SERIE);
        req.setChassisNo(VALID_CHNO);
        req.setUpdateUser("test_user");

        UD05ModifyDocumentSaveRequest.VariableItem item = new UD05ModifyDocumentSaveRequest.VariableItem();
        item.setVariable(VAR_NAME);
        item.setNewval(NEW_VAL);
        req.setVariables(Collections.singletonList(item));

        when(hdocAdcaModificationMapper.updateNewval(VALID_SERIE, VALID_CHNO, VAR_NAME, NEW_VAL, "test_user"))
                .thenReturn(1);

        ApiResponse<Void> result = service.saveModifyDocument(req);
        assertEquals(200, result.getCode().intValue());

        verify(hdocAdcaModificationMapper, times(1))
                .updateNewval(VALID_SERIE, VALID_CHNO, VAR_NAME, NEW_VAL, "test_user");
    }

    @Test
    @DisplayName("saveModifyDocument-更新结果等于0-不计数")
    void testSaveModifyDocument_UpdateResultZero() {
        UD05ModifyDocumentSaveRequest req = new UD05ModifyDocumentSaveRequest();
        req.setChassisSeries(VALID_SERIE);
        req.setChassisNo(VALID_CHNO);

        UD05ModifyDocumentSaveRequest.VariableItem item = new UD05ModifyDocumentSaveRequest.VariableItem();
        item.setVariable(VAR_NAME);
        item.setNewval(NEW_VAL);
        req.setVariables(Collections.singletonList(item));

        when(hdocAdcaModificationMapper.updateNewval(VALID_SERIE, VALID_CHNO, VAR_NAME, NEW_VAL, "SYSTEM"))
                .thenReturn(0);

        ApiResponse<Void> result = service.saveModifyDocument(req);
        assertEquals(200, result.getCode().intValue());

        verify(hdocAdcaModificationMapper, times(1))
                .updateNewval(VALID_SERIE, VALID_CHNO, VAR_NAME, NEW_VAL, "SYSTEM");
    }

    @Test
    @DisplayName("saveModifyDocument-Newval为null-跳过更新")
    void testSaveModifyDocument_NewvalNull() {
        UD05ModifyDocumentSaveRequest req = new UD05ModifyDocumentSaveRequest();
        req.setChassisSeries(VALID_SERIE);
        req.setChassisNo(VALID_CHNO);

        UD05ModifyDocumentSaveRequest.VariableItem item = new UD05ModifyDocumentSaveRequest.VariableItem();
        item.setVariable(VAR_NAME);
        item.setNewval(null);
        req.setVariables(Collections.singletonList(item));

        ApiResponse<Void> result = service.saveModifyDocument(req);
        assertEquals(200, result.getCode().intValue());

        verify(hdocAdcaModificationMapper, never())
                .updateNewval(anyString(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("saveModifyDocument-Newval为空字符串-跳过更新")
    void testSaveModifyDocument_NewvalEmpty() {
        UD05ModifyDocumentSaveRequest req = new UD05ModifyDocumentSaveRequest();
        req.setChassisSeries(VALID_SERIE);
        req.setChassisNo(VALID_CHNO);

        UD05ModifyDocumentSaveRequest.VariableItem item = new UD05ModifyDocumentSaveRequest.VariableItem();
        item.setVariable(VAR_NAME);
        item.setNewval("");
        req.setVariables(Collections.singletonList(item));

        ApiResponse<Void> result = service.saveModifyDocument(req);
        assertEquals(200, result.getCode().intValue());

        verify(hdocAdcaModificationMapper, never())
                .updateNewval(anyString(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("saveModifyDocument-UpdateUser为null-使用默认SYSTEM")
    void testSaveModifyDocument_UpdateUserNull() {
        UD05ModifyDocumentSaveRequest req = new UD05ModifyDocumentSaveRequest();
        req.setChassisSeries(VALID_SERIE);
        req.setChassisNo(VALID_CHNO);
        req.setUpdateUser(null);

        UD05ModifyDocumentSaveRequest.VariableItem item = new UD05ModifyDocumentSaveRequest.VariableItem();
        item.setVariable(VAR_NAME);
        item.setNewval(NEW_VAL);
        req.setVariables(Collections.singletonList(item));

        when(hdocAdcaModificationMapper.updateNewval(VALID_SERIE, VALID_CHNO, VAR_NAME, NEW_VAL, "SYSTEM"))
                .thenReturn(1);

        ApiResponse<Void> result = service.saveModifyDocument(req);
        assertEquals(200, result.getCode().intValue());

        verify(hdocAdcaModificationMapper, times(1))
                .updateNewval(VALID_SERIE, VALID_CHNO, VAR_NAME, NEW_VAL, "SYSTEM");
    }

    @Test
    @DisplayName("saveModifyDocument-Mapper抛出异常-返回500")
    void testSaveModifyDocument_Exception() {
        UD05ModifyDocumentSaveRequest req = new UD05ModifyDocumentSaveRequest();
        req.setChassisSeries(VALID_SERIE);
        req.setChassisNo(VALID_CHNO);

        UD05ModifyDocumentSaveRequest.VariableItem item = new UD05ModifyDocumentSaveRequest.VariableItem();
        item.setVariable(VAR_NAME);
        item.setNewval(NEW_VAL);
        req.setVariables(Collections.singletonList(item));

        when(hdocAdcaModificationMapper.updateNewval(VALID_SERIE, VALID_CHNO, VAR_NAME, NEW_VAL, "SYSTEM"))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<Void> result = service.saveModifyDocument(req);
        assertEquals(500, result.getCode().intValue());
        assertEquals("System error. Please contact administrator.", result.getMsg());

        verify(hdocAdcaModificationMapper, times(1))
                .updateNewval(VALID_SERIE, VALID_CHNO, VAR_NAME, NEW_VAL, "SYSTEM");
    }

    @Test
    @DisplayName("saveModifyDocument-多个变量-部分更新成功")
    void testSaveModifyDocument_MultipleVariables() {
        UD05ModifyDocumentSaveRequest req = new UD05ModifyDocumentSaveRequest();
        req.setChassisSeries(VALID_SERIE);
        req.setChassisNo(VALID_CHNO);

        UD05ModifyDocumentSaveRequest.VariableItem item1 = new UD05ModifyDocumentSaveRequest.VariableItem();
        item1.setVariable("VAR1");
        item1.setNewval("VAL1");

        UD05ModifyDocumentSaveRequest.VariableItem item2 = new UD05ModifyDocumentSaveRequest.VariableItem();
        item2.setVariable("VAR2");
        item2.setNewval(null); // 跳过

        UD05ModifyDocumentSaveRequest.VariableItem item3 = new UD05ModifyDocumentSaveRequest.VariableItem();
        item3.setVariable("VAR3");
        item3.setNewval("VAL3");

        req.setVariables(Arrays.asList(item1, item2, item3));

        when(hdocAdcaModificationMapper.updateNewval(VALID_SERIE, VALID_CHNO, "VAR1", "VAL1", "SYSTEM"))
                .thenReturn(1);
        when(hdocAdcaModificationMapper.updateNewval(VALID_SERIE, VALID_CHNO, "VAR3", "VAL3", "SYSTEM"))
                .thenReturn(1);

        ApiResponse<Void> result = service.saveModifyDocument(req);
        assertEquals(200, result.getCode().intValue());

        verify(hdocAdcaModificationMapper, times(1))
                .updateNewval(VALID_SERIE, VALID_CHNO, "VAR1", "VAL1", "SYSTEM");
        verify(hdocAdcaModificationMapper, never())
                .updateNewval(VALID_SERIE, VALID_CHNO, "VAR2", null, "SYSTEM");
        verify(hdocAdcaModificationMapper, times(1))
                .updateNewval(VALID_SERIE, VALID_CHNO, "VAR3", "VAL3", "SYSTEM");
    }
}
