package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocSendDataVinPlate;
import com.web.app.mapper.UD15Mapper;
import com.web.app.service.impl.UD15ServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD15ServiceImpl 单元测试
 * 覆盖所有分支路径，达到100%分支覆盖率
 */
@ExtendWith(MockitoExtension.class)
class UD15ServiceImplTest {

    @Mock
    private UD15Mapper ud15Mapper;

    @InjectMocks
    private UD15ServiceImpl service;

    private HdocSendDataVinPlate createRequest(String serie, String chnr, String updateUser) {
        HdocSendDataVinPlate r = new HdocSendDataVinPlate();
        r.setSerie(serie);
        r.setChnr(chnr);
        r.setUpdateUser(updateUser);
        return r;
    }

    private HdocSendDataVinPlate createVinPlateRecord() {
        HdocSendDataVinPlate r = new HdocSendDataVinPlate();
        r.setSerie("ABCD");
        r.setChnr("123456");
        r.setType("1");
        r.setStatus("0");
        r.setMsg("test msg");
        r.setRegisterDatetime("2026-07-20 10:00:00");
        r.setDocReady("Y");
        r.setDocSent("N");
        r.setXmlDoc("<xml/>");
        r.setUpdateUser("admin");
        return r;
    }

    // ============================================================
    // viewInfo() — 参数校验
    // ============================================================

    @Test
    @DisplayName("viewInfo - chnr为null，应返回400")
    void viewInfo_ChnrNull_ShouldReturn400() {
        HdocSendDataVinPlate r = createRequest("ABCD", null, "admin");

        ApiResponse<?> result = service.viewInfo(r);

        assertEquals(400, result.getCode());
        assertEquals("Chassis number不能为空", result.getMsg());
        verifyNoInteractions(ud15Mapper);
    }

    @Test
    @DisplayName("viewInfo - chnr为空字符串，应返回400")
    void viewInfo_ChnrEmpty_ShouldReturn400() {
        HdocSendDataVinPlate r = createRequest("ABCD", "", "admin");

        ApiResponse<?> result = service.viewInfo(r);

        assertEquals(400, result.getCode());
        assertEquals("Chassis number不能为空", result.getMsg());
        verifyNoInteractions(ud15Mapper);
    }

    @Test
    @DisplayName("viewInfo - chnr为空白字符串，应返回400")
    void viewInfo_ChnrBlank_ShouldReturn400() {
        HdocSendDataVinPlate r = createRequest("ABCD", "   ", "admin");

        ApiResponse<?> result = service.viewInfo(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(ud15Mapper);
    }

    // ============================================================
    // viewInfo() — 业务逻辑
    // ============================================================

    @Test
    @DisplayName("viewInfo - serie为null，使用空字符串查询，记录不存在返回400")
    void viewInfo_SerieNullRecordNotFound_ShouldReturn400() {
        HdocSendDataVinPlate r = createRequest(null, "123456", "admin");
        when(ud15Mapper.selectByChnr("", "123456")).thenReturn(null);

        ApiResponse<?> result = service.viewInfo(r);

        assertEquals(400, result.getCode());
        assertEquals("Chassis number 123456 not found.", result.getMsg());
        verify(ud15Mapper, times(1)).selectByChnr("", "123456");
    }

    @Test
    @DisplayName("viewInfo - serie有值，记录存在，应返回完整信息")
    void viewInfo_SerieProvidedRecordExists_ShouldReturnFullInfo() {
        HdocSendDataVinPlate r = createRequest("ABCD", "123456", "admin");
        when(ud15Mapper.selectByChnr("ABCD", "123456")).thenReturn(createVinPlateRecord());

        ApiResponse<?> result = service.viewInfo(r);

        assertEquals(200, result.getCode());
        assertEquals("查看VIN Plate信息成功", result.getMsg());
        assertNotNull(result.getData());
        Map<?, ?> data = (Map<?, ?>) result.getData();
        assertEquals("ABCD-123456", data.get("chassisNumber"));
        assertEquals("1", data.get("type"));
        assertEquals("0", data.get("status"));
        assertEquals("test msg", data.get("msg"));
        assertEquals("2026-07-20 10:00:00", data.get("registerDatetime"));
        assertEquals("Y", data.get("docReady"));
        assertEquals("N", data.get("docSent"));
        assertEquals("<xml/>", data.get("xmlDoc"));
    }

    @Test
    @DisplayName("viewInfo - serie为空字符串，chassisNumber应只包含chnr")
    void viewInfo_SerieEmpty_ShouldReturnChassisNumberWithoutSerie() {
        HdocSendDataVinPlate r = createRequest("", "123456", "admin");
        when(ud15Mapper.selectByChnr("", "123456")).thenReturn(createVinPlateRecord());

        ApiResponse<?> result = service.viewInfo(r);

        assertEquals(200, result.getCode());
        assertEquals("123456", ((Map<?, ?>) result.getData()).get("chassisNumber"));
    }

    @Test
    @DisplayName("viewInfo - serie为null但有记录，chassisNumber应只包含chnr")
    void viewInfo_SerieNullButRecordExists_ShouldUseChnrOnly() {
        HdocSendDataVinPlate r = createRequest(null, "123456", "admin");
        HdocSendDataVinPlate record = createVinPlateRecord();
        record.setSerie("ABCD");
        when(ud15Mapper.selectByChnr("", "123456")).thenReturn(record);

        ApiResponse<?> result = service.viewInfo(r);

        assertEquals(200, result.getCode());
        assertEquals("123456", ((Map<?, ?>) result.getData()).get("chassisNumber"));
    }

    @Test
    @DisplayName("viewInfo - 记录中各字段为null，应用空字符串替代")
    void viewInfo_RecordFieldsNull_ShouldUseEmptyString() {
        HdocSendDataVinPlate r = createRequest("ABCD", "123456", "admin");
        HdocSendDataVinPlate record = new HdocSendDataVinPlate();
        record.setSerie("ABCD");
        record.setChnr("123456");
        // type/status等字段均为null
        when(ud15Mapper.selectByChnr("ABCD", "123456")).thenReturn(record);

        ApiResponse<?> result = service.viewInfo(r);

        assertEquals(200, result.getCode());
        Map<?, ?> data = (Map<?, ?>) result.getData();
        assertEquals("", data.get("type"));
        assertEquals("", data.get("status"));
        assertEquals("", data.get("msg"));
        assertEquals("", data.get("registerDatetime"));
        assertEquals("", data.get("docReady"));
        assertEquals("", data.get("docSent"));
        assertEquals("", data.get("xmlDoc"));
    }

    @Test
    @DisplayName("viewInfo - Mapper异常，应返回500")
    void viewInfo_MapperThrowsException_ShouldReturn500() {
        HdocSendDataVinPlate r = createRequest("ABCD", "123456", "admin");
        when(ud15Mapper.selectByChnr("ABCD", "123456")).thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.viewInfo(r);

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // setRegenerate() — 通过updateStatus实现
    // ============================================================

    @Test
    @DisplayName("setRegenerate - chnr为null，应返回400")
    void setRegenerate_ChnrNull_ShouldReturn400() {
        HdocSendDataVinPlate r = createRequest("ABCD", null, "admin");

        ApiResponse<?> result = service.setRegenerate(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(ud15Mapper);
    }

    @Test
    @DisplayName("setRegenerate - chnr为空白字符串，应返回400")
    void setRegenerate_ChnrBlank_ShouldReturn400() {
        HdocSendDataVinPlate r = createRequest("ABCD", "   ", "admin");

        ApiResponse<?> result = service.setRegenerate(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(ud15Mapper);
    }

    @Test
    @DisplayName("setRegenerate - 记录不存在，应返回400")
    void setRegenerate_NotFound_ShouldReturn400() {
        HdocSendDataVinPlate r = createRequest("ABCD", "123456", "admin");
        when(ud15Mapper.countByChnr("ABCD", "123456")).thenReturn(0);

        ApiResponse<?> result = service.setRegenerate(r);

        assertEquals(400, result.getCode());
        assertEquals("记录不存在", result.getMsg());
        verify(ud15Mapper, never()).updateStatus(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("setRegenerate - serie为null使用空串，updateUser空字符串使用SYSTEM")
    void setRegenerate_SerieNullAndUserEmpty_ShouldUseDefaults() {
        HdocSendDataVinPlate r = createRequest(null, "123456", "");
        when(ud15Mapper.countByChnr("", "123456")).thenReturn(1);
        when(ud15Mapper.updateStatus("", "123456", "0", "SYSTEM", "UD15_REGENERATE")).thenReturn(1);

        ApiResponse<?> result = service.setRegenerate(r);

        assertEquals(200, result.getCode());
        assertEquals("设置重新生成成功", result.getMsg());
    }

    @Test
    @DisplayName("setRegenerate - updateUser为空白字符串，应使用SYSTEM")
    void setRegenerate_UserBlank_ShouldUseSystem() {
        HdocSendDataVinPlate r = createRequest("ABCD", "123456", "   ");
        when(ud15Mapper.countByChnr("ABCD", "123456")).thenReturn(1);
        when(ud15Mapper.updateStatus("ABCD", "123456", "0", "SYSTEM", "UD15_REGENERATE")).thenReturn(1);

        ApiResponse<?> result = service.setRegenerate(r);

        assertEquals(200, result.getCode());
        assertEquals("设置重新生成成功", result.getMsg());
    }

    @Test
    @DisplayName("setRegenerate - 更新成功，应返回成功消息")
    void setRegenerate_Success_ShouldReturnSuccess() {
        HdocSendDataVinPlate r = createRequest("ABCD", "123456", "admin");
        when(ud15Mapper.countByChnr("ABCD", "123456")).thenReturn(1);
        when(ud15Mapper.updateStatus("ABCD", "123456", "0", "admin", "UD15_REGENERATE")).thenReturn(1);

        ApiResponse<?> result = service.setRegenerate(r);

        assertEquals(200, result.getCode());
        assertEquals("设置重新生成成功", result.getMsg());
        assertNotNull(result.getData());
    }

    @Test
    @DisplayName("setRegenerate - 更新返回0，应返回500")
    void setRegenerate_UpdateReturnsZero_ShouldReturn500() {
        HdocSendDataVinPlate r = createRequest("ABCD", "123456", "admin");
        when(ud15Mapper.countByChnr("ABCD", "123456")).thenReturn(1);
        when(ud15Mapper.updateStatus("ABCD", "123456", "0", "admin", "UD15_REGENERATE")).thenReturn(0);

        ApiResponse<?> result = service.setRegenerate(r);

        assertEquals(500, result.getCode());
        assertEquals("更新失败，请重试", result.getMsg());
    }

    @Test
    @DisplayName("setRegenerate - Mapper异常，应返回500")
    void setRegenerate_MapperThrowsException_ShouldReturn500() {
        HdocSendDataVinPlate r = createRequest("ABCD", "123456", "admin");
        when(ud15Mapper.countByChnr("ABCD", "123456")).thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.setRegenerate(r);

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // setOk() — 通过updateStatus(status="1")实现
    // ============================================================

    @Test
    @DisplayName("setOk - 更新成功，应返回设置OK成功")
    void setOk_Success_ShouldReturnSuccess() {
        HdocSendDataVinPlate r = createRequest("ABCD", "123456", "admin");
        when(ud15Mapper.countByChnr("ABCD", "123456")).thenReturn(1);
        when(ud15Mapper.updateStatus("ABCD", "123456", "1", "admin", "UD15_SET_OK")).thenReturn(1);

        ApiResponse<?> result = service.setOk(r);

        assertEquals(200, result.getCode());
        assertEquals("设置OK成功", result.getMsg());
    }

    // ============================================================
    // changeToBasicInfo() — 通过updateStatusAndType(type="1")实现
    // ============================================================

    @Test
    @DisplayName("changeToBasicInfo - chnr为空字符串，应返回400")
    void changeToBasicInfo_ChnrEmpty_ShouldReturn400() {
        HdocSendDataVinPlate r = createRequest("ABCD", "", "admin");

        ApiResponse<?> result = service.changeToBasicInfo(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(ud15Mapper);
    }

    @Test
    @DisplayName("changeToBasicInfo - 记录不存在，应返回400")
    void changeToBasicInfo_NotFound_ShouldReturn400() {
        HdocSendDataVinPlate r = createRequest("ABCD", "123456", "admin");
        when(ud15Mapper.countByChnr("ABCD", "123456")).thenReturn(0);

        ApiResponse<?> result = service.changeToBasicInfo(r);

        assertEquals(400, result.getCode());
        assertEquals("记录不存在", result.getMsg());
        verify(ud15Mapper, never()).updateStatusAndType(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("changeToBasicInfo - 更新成功，应返回切换到基础信息成功")
    void changeToBasicInfo_Success_ShouldReturnBasicMsg() {
        HdocSendDataVinPlate r = createRequest("ABCD", "123456", "admin");
        when(ud15Mapper.countByChnr("ABCD", "123456")).thenReturn(1);
        when(ud15Mapper.updateStatusAndType("ABCD", "123456", "0", "1", "admin", "UD15_CHANGE_BASIC")).thenReturn(1);

        ApiResponse<?> result = service.changeToBasicInfo(r);

        assertEquals(200, result.getCode());
        assertEquals("切换到基础信息成功", result.getMsg());
    }

    @Test
    @DisplayName("changeToBasicInfo - 更新返回0，应返回500")
    void changeToBasicInfo_UpdateReturnsZero_ShouldReturn500() {
        HdocSendDataVinPlate r = createRequest("ABCD", "123456", "admin");
        when(ud15Mapper.countByChnr("ABCD", "123456")).thenReturn(1);
        when(ud15Mapper.updateStatusAndType("ABCD", "123456", "0", "1", "admin", "UD15_CHANGE_BASIC")).thenReturn(0);

        ApiResponse<?> result = service.changeToBasicInfo(r);

        assertEquals(500, result.getCode());
        assertEquals("更新失败，请重试", result.getMsg());
    }

    @Test
    @DisplayName("changeToBasicInfo - Mapper异常，应返回500")
    void changeToBasicInfo_MapperThrowsException_ShouldReturn500() {
        HdocSendDataVinPlate r = createRequest("ABCD", "123456", "admin");
        when(ud15Mapper.countByChnr("ABCD", "123456")).thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.changeToBasicInfo(r);

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // changeToAdvancedInfo() — 通过updateStatusAndType(type="2")实现
    // ============================================================

    @Test
    @DisplayName("changeToAdvancedInfo - updateUser为null，使用SYSTEM")
    void changeToAdvancedInfo_UserNull_ShouldUseSystem() {
        HdocSendDataVinPlate r = createRequest("ABCD", "123456", null);
        when(ud15Mapper.countByChnr("ABCD", "123456")).thenReturn(1);
        when(ud15Mapper.updateStatusAndType("ABCD", "123456", "0", "2", "SYSTEM", "UD15_CHANGE_ADVANCED")).thenReturn(1);

        ApiResponse<?> result = service.changeToAdvancedInfo(r);

        assertEquals(200, result.getCode());
        assertEquals("切换到高级信息成功", result.getMsg());
    }

    @Test
    @DisplayName("changeToAdvancedInfo - updateUser为空白字符串，使用SYSTEM")
    void changeToAdvancedInfo_UserBlank_ShouldUseSystem() {
        HdocSendDataVinPlate r = createRequest("ABCD", "123456", "   ");
        when(ud15Mapper.countByChnr("ABCD", "123456")).thenReturn(1);
        when(ud15Mapper.updateStatusAndType("ABCD", "123456", "0", "2", "SYSTEM", "UD15_CHANGE_ADVANCED")).thenReturn(1);

        ApiResponse<?> result = service.changeToAdvancedInfo(r);

        assertEquals(200, result.getCode());
        assertEquals("切换到高级信息成功", result.getMsg());
    }

    @Test
    @DisplayName("changeToAdvancedInfo - chnr为空白字符串，应返回400")
    void changeToAdvancedInfo_ChnrBlank_ShouldReturn400() {
        HdocSendDataVinPlate r = createRequest("ABCD", "   ", "admin");

        ApiResponse<?> result = service.changeToAdvancedInfo(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(ud15Mapper);
    }
}
