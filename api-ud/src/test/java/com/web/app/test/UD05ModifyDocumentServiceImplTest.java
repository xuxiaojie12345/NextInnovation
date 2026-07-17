package com.web.app.test;

import com.web.app.dto.UD05ModifyDocumentRequest;
import com.web.app.dto.UD05ModifyDocumentResponse;
import com.web.app.dto.UD05ModifyDocumentUpdateRequest;
import com.web.app.dto.UD05ModifyDocumentUpdateRequest.ModifyItem;
import com.web.app.entity.UD05ModifyDocumentVO;
import com.web.app.mapper.UD05ModifyDocumentMapper;
import com.web.app.service.impl.UD05ModifyDocumentServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD05ModifyDocumentServiceImpl 单元测试
 * 覆盖两个业务方法的所有分支，达到 100% JaCoCo 覆盖率
 *
 * 分支统计：
 * - validateSelectRequest: 7 个错误分支 + 1 个通过 = 8 分支
 * - validateUpdateRequest: 12 个错误分支 + 1 个通过 = 13 分支
 * - UD05SelectVariableModification: 5 个分支（验证失败/voList null/voList empty/成功/异常）
 * - UD05UpdateHdocAdcaModification: 6 个分支（验证失败/userId empty/更新失败/成功/单条成功/异常）
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD05ModifyDocumentServiceImpl 单元测试")
class UD05ModifyDocumentServiceImplTest {

    @Mock
    private UD05ModifyDocumentMapper ud05Mapper;

    @InjectMocks
    private UD05ModifyDocumentServiceImpl service;

    // ====================================================================
    // UD05SelectVariableModification 测试
    // ====================================================================

    // -------------------- validateSelectRequest 分支（7个错误 + 1个通过 =
    // 8分支）--------------------

    @Test
    @DisplayName("[Select] request 为 null 时应返回400")
    void testSelect_RequestNull() {
        UD05ModifyDocumentResponse response = service.UD05SelectVariableModification(null);
        assertEquals(400, response.getCode());
        assertEquals("Request is required.", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Select] chassisSerie 为 null 时应返回400")
    void testSelect_ChassisSerieNull() {
        UD05ModifyDocumentRequest request = new UD05ModifyDocumentRequest(null, "12345");
        UD05ModifyDocumentResponse response = service.UD05SelectVariableModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Chassis serie is required.", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Select] chassisSerie 为空字符串时应返回400")
    void testSelect_ChassisSerieEmpty() {
        UD05ModifyDocumentRequest request = new UD05ModifyDocumentRequest("", "12345");
        UD05ModifyDocumentResponse response = service.UD05SelectVariableModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Chassis serie is required.", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Select] chassisSerie 超过5字符时应返回400")
    void testSelect_ChassisSerieTooLong() {
        UD05ModifyDocumentRequest request = new UD05ModifyDocumentRequest("ABCDEF", "12345");
        UD05ModifyDocumentResponse response = service.UD05SelectVariableModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Chassis serie must be at most 5 characters.", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Select] chassisSerie 包含非英数字符时应返回400")
    void testSelect_ChassisSerieInvalidChars() {
        UD05ModifyDocumentRequest request = new UD05ModifyDocumentRequest("AB-12", "12345");
        UD05ModifyDocumentResponse response = service.UD05SelectVariableModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Chassis serie must contain only alphanumeric characters.", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Select] chassisNo 为 null 时应返回400")
    void testSelect_ChassisNoNull() {
        UD05ModifyDocumentRequest request = new UD05ModifyDocumentRequest("ABC12", null);
        UD05ModifyDocumentResponse response = service.UD05SelectVariableModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Chassis no is required.", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Select] chassisNo 为空字符串时应返回400")
    void testSelect_ChassisNoEmpty() {
        UD05ModifyDocumentRequest request = new UD05ModifyDocumentRequest("ABC12", "");
        UD05ModifyDocumentResponse response = service.UD05SelectVariableModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Chassis no is required.", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Select] chassisNo 超过10字符时应返回400")
    void testSelect_ChassisNoTooLong() {
        UD05ModifyDocumentRequest request = new UD05ModifyDocumentRequest("ABC12", "12345678901");
        UD05ModifyDocumentResponse response = service.UD05SelectVariableModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Chassis no must be at most 10 characters.", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Select] chassisNo 包含非数字字符时应返回400")
    void testSelect_ChassisNoInvalidChars() {
        UD05ModifyDocumentRequest request = new UD05ModifyDocumentRequest("ABC12", "1234A");
        UD05ModifyDocumentResponse response = service.UD05SelectVariableModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Chassis no must contain only digits.", response.getMsg());
        assertNull(response.getData());
    }

    // -------------------- Select 业务逻辑分支 --------------------

    @Test
    @DisplayName("[Select] voList 为 null 时应返回404")
    void testSelect_VoListNull() {
        when(ud05Mapper.selectVariableModification("ABC12", "12345")).thenReturn(null);

        UD05ModifyDocumentRequest request = new UD05ModifyDocumentRequest("ABC12", "12345");
        UD05ModifyDocumentResponse response = service.UD05SelectVariableModification(request);

        assertEquals(404, response.getCode());
        assertEquals("Record not found.", response.getMsg());
        assertNull(response.getData());
        verify(ud05Mapper, times(1)).selectVariableModification("ABC12", "12345");
    }

    @Test
    @DisplayName("[Select] voList 为空列表时应返回404")
    void testSelect_VoListEmpty() {
        when(ud05Mapper.selectVariableModification("ABC12", "12345"))
                .thenReturn(Collections.emptyList());

        UD05ModifyDocumentRequest request = new UD05ModifyDocumentRequest("ABC12", "12345");
        UD05ModifyDocumentResponse response = service.UD05SelectVariableModification(request);

        assertEquals(404, response.getCode());
        assertEquals("Record not found.", response.getMsg());
        assertNull(response.getData());
        verify(ud05Mapper, times(1)).selectVariableModification("ABC12", "12345");
    }

    @Test
    @DisplayName("[Select] 查询成功时应返回200及数据列表")
    void testSelect_Success() {
        UD05ModifyDocumentVO vo1 = new UD05ModifyDocumentVO();
        vo1.setChassisSerie("ABC12");
        vo1.setChassisNo("12345");
        vo1.setVariable("VAR001");
        vo1.setDescription("Engine Type");
        vo1.setOldVal("Old");
        vo1.setNewVal("New");
        vo1.setSta("0");

        UD05ModifyDocumentVO vo2 = new UD05ModifyDocumentVO();
        vo2.setChassisSerie("ABC12");
        vo2.setChassisNo("12345");
        vo2.setVariable("VAR002");
        vo2.setDescription("Tire Size");
        vo2.setOldVal("Old2");
        vo2.setNewVal("New2");
        vo2.setSta("1");

        when(ud05Mapper.selectVariableModification("ABC12", "12345"))
                .thenReturn(Arrays.asList(vo1, vo2));

        UD05ModifyDocumentRequest request = new UD05ModifyDocumentRequest("ABC12", "12345");
        UD05ModifyDocumentResponse response = service.UD05SelectVariableModification(request);

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());
        assertEquals(2, response.getData().size());
        assertEquals("VAR001", response.getData().get(0).getVariable());
        assertEquals("Engine Type", response.getData().get(0).getDescription());
        assertEquals("Old", response.getData().get(0).getOldVal());
        assertEquals("New", response.getData().get(0).getNewVal());
        assertEquals("0", response.getData().get(0).getSta());
        assertEquals("ABC12", response.getData().get(0).getChassisSerie());
        assertEquals("12345", response.getData().get(0).getChassisNo());
        assertEquals("VAR002", response.getData().get(1).getVariable());
        verify(ud05Mapper, times(1)).selectVariableModification("ABC12", "12345");
    }

    @Test
    @DisplayName("[Select] 系统异常时应返回500")
    void testSelect_Exception() {
        when(ud05Mapper.selectVariableModification(anyString(), anyString()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD05ModifyDocumentRequest request = new UD05ModifyDocumentRequest("ABC12", "12345");
        UD05ModifyDocumentResponse response = service.UD05SelectVariableModification(request);

        assertEquals(500, response.getCode());
        assertEquals("System error. Please try again later.", response.getMsg());
        assertNull(response.getData());
        verify(ud05Mapper, times(1)).selectVariableModification("ABC12", "12345");
    }

    // ====================================================================
    // UD05UpdateHdocAdcaModification 测试
    // ====================================================================

    // -------------------- validateUpdateRequest 分支（12个错误 + 1个通过 =
    // 13分支）--------------------

    @Test
    @DisplayName("[Update] request 为 null 时应返回400")
    void testUpdate_RequestNull() {
        UD05ModifyDocumentResponse response = service.UD05UpdateHdocAdcaModification(null);
        assertEquals(400, response.getCode());
        assertEquals("Request is required.", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Update] chassisSerie 为空时应返回400")
    void testUpdate_ChassisSerieEmpty() {
        UD05ModifyDocumentUpdateRequest request = new UD05ModifyDocumentUpdateRequest();
        request.setChassisSerie(null);
        request.setChassisNo("12345");
        request.setUserId("user01");
        request.setModifiedItems(Collections.singletonList(new ModifyItem("VAR001", "Old", "New")));

        UD05ModifyDocumentResponse response = service.UD05UpdateHdocAdcaModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Chassis serie is required.", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Update] modifiedItems 为 null 时应返回400")
    void testUpdate_ModifiedItemsNull() {
        UD05ModifyDocumentUpdateRequest request = new UD05ModifyDocumentUpdateRequest();
        request.setChassisSerie("ABC12");
        request.setChassisNo("12345");
        request.setUserId("user01");
        request.setModifiedItems(null);

        UD05ModifyDocumentResponse response = service.UD05UpdateHdocAdcaModification(request);
        assertEquals(400, response.getCode());
        assertEquals("At least one modified item is required.", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Update] modifiedItems 为空列表时应返回400")
    void testUpdate_ModifiedItemsEmpty() {
        UD05ModifyDocumentUpdateRequest request = new UD05ModifyDocumentUpdateRequest();
        request.setChassisSerie("ABC12");
        request.setChassisNo("12345");
        request.setUserId("user01");
        request.setModifiedItems(Collections.emptyList());

        UD05ModifyDocumentResponse response = service.UD05UpdateHdocAdcaModification(request);
        assertEquals(400, response.getCode());
        assertEquals("At least one modified item is required.", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Update] modified item 为 null 时应返回400")
    void testUpdate_ModifiedItemNull() {
        UD05ModifyDocumentUpdateRequest request = new UD05ModifyDocumentUpdateRequest();
        request.setChassisSerie("ABC12");
        request.setChassisNo("12345");
        request.setUserId("user01");
        request.setModifiedItems(Collections.singletonList(null));

        UD05ModifyDocumentResponse response = service.UD05UpdateHdocAdcaModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Modified item cannot be null.", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Update] variable 为空时应返回400")
    void testUpdate_VariableEmpty() {
        UD05ModifyDocumentUpdateRequest request = new UD05ModifyDocumentUpdateRequest();
        request.setChassisSerie("ABC12");
        request.setChassisNo("12345");
        request.setUserId("user01");
        request.setModifiedItems(Collections.singletonList(new ModifyItem("", "Old", "New")));

        UD05ModifyDocumentResponse response = service.UD05UpdateHdocAdcaModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Variable is required for each modified item.", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Update] variable 为空白字符串时应返回400")
    void testUpdate_VariableBlank() {
        UD05ModifyDocumentUpdateRequest request = new UD05ModifyDocumentUpdateRequest();
        request.setChassisSerie("ABC12");
        request.setChassisNo("12345");
        request.setUserId("user01");
        request.setModifiedItems(Collections.singletonList(new ModifyItem("   ", "Old", "New")));

        UD05ModifyDocumentResponse response = service.UD05UpdateHdocAdcaModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Variable is required for each modified item.", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Update] currentValue 为空时应返回400")
    void testUpdate_CurrentValueEmpty() {
        UD05ModifyDocumentUpdateRequest request = new UD05ModifyDocumentUpdateRequest();
        request.setChassisSerie("ABC12");
        request.setChassisNo("12345");
        request.setUserId("user01");
        request.setModifiedItems(Collections.singletonList(new ModifyItem("VAR001", "", "New")));

        UD05ModifyDocumentResponse response = service.UD05UpdateHdocAdcaModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Current value is required for each modified item.", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Update] currentValue 超过200字符时应返回400")
    void testUpdate_CurrentValueTooLong() {
        String longValue = "A".repeat(201);
        UD05ModifyDocumentUpdateRequest request = new UD05ModifyDocumentUpdateRequest();
        request.setChassisSerie("ABC12");
        request.setChassisNo("12345");
        request.setUserId("user01");
        request.setModifiedItems(Collections.singletonList(new ModifyItem("VAR001", longValue, "New")));

        UD05ModifyDocumentResponse response = service.UD05UpdateHdocAdcaModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Current value must be at most 200 characters.", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Update] modifiedValue 为空时应返回400")
    void testUpdate_ModifiedValueEmpty() {
        UD05ModifyDocumentUpdateRequest request = new UD05ModifyDocumentUpdateRequest();
        request.setChassisSerie("ABC12");
        request.setChassisNo("12345");
        request.setUserId("user01");
        request.setModifiedItems(Collections.singletonList(new ModifyItem("VAR001", "Old", "")));

        UD05ModifyDocumentResponse response = service.UD05UpdateHdocAdcaModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Modified value is required for each modified item.", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Update] modifiedValue 超过200字符时应返回400")
    void testUpdate_ModifiedValueTooLong() {
        String longValue = "A".repeat(201);
        UD05ModifyDocumentUpdateRequest request = new UD05ModifyDocumentUpdateRequest();
        request.setChassisSerie("ABC12");
        request.setChassisNo("12345");
        request.setUserId("user01");
        request.setModifiedItems(Collections.singletonList(new ModifyItem("VAR001", "Old", longValue)));

        UD05ModifyDocumentResponse response = service.UD05UpdateHdocAdcaModification(request);
        assertEquals(400, response.getCode());
        assertEquals("Modified value must be at most 200 characters.", response.getMsg());
        assertNull(response.getData());
    }

    // -------------------- Update 业务逻辑分支 --------------------

    @Test
    @DisplayName("[Update] userId 为 null 时应返回400")
    void testUpdate_UserIdNull() {
        UD05ModifyDocumentUpdateRequest request = new UD05ModifyDocumentUpdateRequest();
        request.setChassisSerie("ABC12");
        request.setChassisNo("12345");
        request.setUserId(null);
        request.setModifiedItems(Collections.singletonList(new ModifyItem("VAR001", "Old", "New")));

        UD05ModifyDocumentResponse response = service.UD05UpdateHdocAdcaModification(request);
        assertEquals(400, response.getCode());
        assertEquals("User ID is required.", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Update] userId 为空字符串时应返回400")
    void testUpdate_UserIdEmpty() {
        UD05ModifyDocumentUpdateRequest request = new UD05ModifyDocumentUpdateRequest();
        request.setChassisSerie("ABC12");
        request.setChassisNo("12345");
        request.setUserId("");
        request.setModifiedItems(Collections.singletonList(new ModifyItem("VAR001", "Old", "New")));

        UD05ModifyDocumentResponse response = service.UD05UpdateHdocAdcaModification(request);
        assertEquals(400, response.getCode());
        assertEquals("User ID is required.", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Update] update 返回 <= 0 时应抛出 RuntimeException 转为500")
    void testUpdate_UpdateFailed() {
        UD05ModifyDocumentUpdateRequest request = new UD05ModifyDocumentUpdateRequest();
        request.setChassisSerie("ABC12");
        request.setChassisNo("12345");
        request.setUserId("user01");
        request.setModifiedItems(Collections.singletonList(new ModifyItem("VAR001", "Old", "New")));

        when(ud05Mapper.updateHdocAdcaModificationByVariable("ABC12", "12345", "VAR001", "Old", "New", "user01"))
                .thenReturn(0);

        UD05ModifyDocumentResponse response = service.UD05UpdateHdocAdcaModification(request);

        assertEquals(500, response.getCode());
        assertEquals("System error. Please try again later.", response.getMsg());
        assertNull(response.getData());
        verify(ud05Mapper, times(1))
                .updateHdocAdcaModificationByVariable("ABC12", "12345", "VAR001", "Old", "New", "user01");
    }

    @Test
    @DisplayName("[Update] 单条记录更新成功时应返回200")
    void testUpdate_SuccessSingleItem() {
        UD05ModifyDocumentUpdateRequest request = new UD05ModifyDocumentUpdateRequest();
        request.setChassisSerie("ABC12");
        request.setChassisNo("12345");
        request.setUserId("user01");
        request.setModifiedItems(Collections.singletonList(new ModifyItem("VAR001", "Old", "New")));

        when(ud05Mapper.updateHdocAdcaModificationByVariable("ABC12", "12345", "VAR001", "Old", "New", "user01"))
                .thenReturn(1);

        UD05ModifyDocumentResponse response = service.UD05UpdateHdocAdcaModification(request);

        assertEquals(200, response.getCode());
        assertEquals("Update successful", response.getMsg());
        assertNull(response.getData());
        verify(ud05Mapper, times(1))
                .updateHdocAdcaModificationByVariable("ABC12", "12345", "VAR001", "Old", "New", "user01");
    }

    @Test
    @DisplayName("[Update] 多条记录更新成功时应返回200")
    void testUpdate_SuccessMultipleItems() {
        ModifyItem item1 = new ModifyItem("VAR001", "Old1", "New1");
        ModifyItem item2 = new ModifyItem("VAR002", "Old2", "New2");
        List<ModifyItem> items = Arrays.asList(item1, item2);

        UD05ModifyDocumentUpdateRequest request = new UD05ModifyDocumentUpdateRequest();
        request.setChassisSerie("ABC12");
        request.setChassisNo("12345");
        request.setUserId("user01");
        request.setModifiedItems(items);

        when(ud05Mapper.updateHdocAdcaModificationByVariable("ABC12", "12345", "VAR001", "Old1", "New1", "user01"))
                .thenReturn(1);
        when(ud05Mapper.updateHdocAdcaModificationByVariable("ABC12", "12345", "VAR002", "Old2", "New2", "user01"))
                .thenReturn(1);

        UD05ModifyDocumentResponse response = service.UD05UpdateHdocAdcaModification(request);

        assertEquals(200, response.getCode());
        assertEquals("Update successful", response.getMsg());
        assertNull(response.getData());
        verify(ud05Mapper, times(1))
                .updateHdocAdcaModificationByVariable("ABC12", "12345", "VAR001", "Old1", "New1", "user01");
        verify(ud05Mapper, times(1))
                .updateHdocAdcaModificationByVariable("ABC12", "12345", "VAR002", "Old2", "New2", "user01");
    }

    @Test
    @DisplayName("[Update] 系统异常时应返回500")
    void testUpdate_Exception() {
        when(ud05Mapper.updateHdocAdcaModificationByVariable(
                anyString(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD05ModifyDocumentUpdateRequest request = new UD05ModifyDocumentUpdateRequest();
        request.setChassisSerie("ABC12");
        request.setChassisNo("12345");
        request.setUserId("user01");
        request.setModifiedItems(Collections.singletonList(new ModifyItem("VAR001", "Old", "New")));

        UD05ModifyDocumentResponse response = service.UD05UpdateHdocAdcaModification(request);

        assertEquals(500, response.getCode());
        assertEquals("System error. Please try again later.", response.getMsg());
        assertNull(response.getData());
        verify(ud05Mapper, times(1))
                .updateHdocAdcaModificationByVariable("ABC12", "12345", "VAR001", "Old", "New", "user01");
    }
}
