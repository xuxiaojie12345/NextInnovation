package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocSendDataVinPlate;
import com.web.app.mapper.UD15Mapper;
import com.web.app.service.impl.UD15ServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
 * 覆盖 viewInfo / setRegenerate / setOk / changeToBasicInfo / changeToAdvancedInfo
 * および内部メソッド updateStatus / updateStatusAndType の全分支
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD15ServiceImpl 单元测试")
class UD15ServiceImplTest {

    @Mock private UD15Mapper ud15Mapper;
    @InjectMocks private UD15ServiceImpl service;

    private HdocSendDataVinPlate validReq;
    private HdocSendDataVinPlate validRecord;

    @BeforeEach
    void setUp() {
        reset(ud15Mapper);

        validReq = new HdocSendDataVinPlate();
        validReq.setSerie("JPCT");
        validReq.setChnr("013945");
        validReq.setUpdateUser("admin");

        validRecord = new HdocSendDataVinPlate();
        validRecord.setType("VIN_PLATE");
        validRecord.setStatus("1");
        validRecord.setMsg("");
        validRecord.setRegisterDatetime("2026-01-15 10:30:00");
        validRecord.setDocReady("2026-01-16 14:00:00");
        validRecord.setDocSent("2026-01-17 09:00:00");
        validRecord.setXmlDoc("<root><item/></root>");
    }

    // ========================================================================
    // viewInfo
    // ========================================================================
    @Nested
    @DisplayName("viewInfo")
    class ViewInfoTest {

        @Test @DisplayName("chnrがnull→400")
        void testChnrNull() {
            validReq.setChnr(null);
            assertEquals(400, service.viewInfo(validReq).getCode().intValue());
            verifyNoInteractions(ud15Mapper);
        }

        @Test @DisplayName("chnrが空→400")
        void testChnrEmpty() {
            validReq.setChnr("");
            assertEquals(400, service.viewInfo(validReq).getCode().intValue());
            verifyNoInteractions(ud15Mapper);
        }

        @Test @DisplayName("chnrが空白→400")
        void testChnrBlank() {
            validReq.setChnr("   ");
            assertEquals(400, service.viewInfo(validReq).getCode().intValue());
            verifyNoInteractions(ud15Mapper);
        }

        @Test @DisplayName("recordがnull→400 not found")
        void testRecordNotFound() {
            when(ud15Mapper.selectByChnr("JPCT", "013945")).thenReturn(null);
            ApiResponse<?> resp = service.viewInfo(validReq);
            assertEquals(400, resp.getCode().intValue());
            assertTrue(resp.getMsg().contains("not found"));
        }

        @Test @DisplayName("正常系-serieあり→chassisNumber=serie-chnr")
        void testSuccessWithSerie() {
            when(ud15Mapper.selectByChnr("JPCT", "013945")).thenReturn(validRecord);
            ApiResponse<?> resp = service.viewInfo(validReq);
            assertEquals(200, resp.getCode().intValue());

            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) resp.getData();
            assertEquals("JPCT-013945", data.get("chassisNumber"));
            assertEquals("VIN_PLATE", data.get("type"));
            assertEquals("1", data.get("status"));
            assertEquals("", data.get("msg"));
            assertEquals("2026-01-15 10:30:00", data.get("registerDatetime"));
            assertEquals("2026-01-16 14:00:00", data.get("docReady"));
            assertEquals("2026-01-17 09:00:00", data.get("docSent"));
            assertEquals("<root><item/></root>", data.get("xmlDoc"));
        }

        @Test @DisplayName("正常系-serieがnull→chassisNumber=chnrのみ")
        void testSuccessSerieNull() {
            validReq.setSerie(null);
            when(ud15Mapper.selectByChnr("", "013945")).thenReturn(validRecord);
            ApiResponse<?> resp = service.viewInfo(validReq);
            assertEquals(200, resp.getCode().intValue());

            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) resp.getData();
            assertEquals("013945", data.get("chassisNumber"));
        }

        @Test @DisplayName("正常系-serieが空→chassisNumber=chnrのみ")
        void testSuccessSerieEmpty() {
            validReq.setSerie("");
            when(ud15Mapper.selectByChnr("", "013945")).thenReturn(validRecord);
            ApiResponse<?> resp = service.viewInfo(validReq);
            assertEquals(200, resp.getCode().intValue());

            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) resp.getData();
            assertEquals("013945", data.get("chassisNumber"));
        }

        @Test @DisplayName("正常系-recordのフィールドがnull→空文字に変換")
        void testSuccessRecordFieldsNull() {
            HdocSendDataVinPlate nullRecord = new HdocSendDataVinPlate();
            nullRecord.setType(null);
            nullRecord.setStatus(null);
            nullRecord.setMsg(null);
            nullRecord.setRegisterDatetime(null);
            nullRecord.setDocReady(null);
            nullRecord.setDocSent(null);
            nullRecord.setXmlDoc(null);

            when(ud15Mapper.selectByChnr("JPCT", "013945")).thenReturn(nullRecord);
            ApiResponse<?> resp = service.viewInfo(validReq);
            assertEquals(200, resp.getCode().intValue());

            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) resp.getData();
            assertEquals("", data.get("type"));
            assertEquals("", data.get("status"));
            assertEquals("", data.get("msg"));
            assertEquals("", data.get("registerDatetime"));
            assertEquals("", data.get("docReady"));
            assertEquals("", data.get("docSent"));
            assertEquals("", data.get("xmlDoc"));
        }

        @Test @DisplayName("異常系-mapper例外→500")
        void testException() {
            when(ud15Mapper.selectByChnr("JPCT", "013945")).thenThrow(new RuntimeException("DB error"));
            assertEquals(500, service.viewInfo(validReq).getCode().intValue());
        }
    }

    // ========================================================================
    // setRegenerate / setOk（updateStatus経由）
    // ========================================================================
    @Nested
    @DisplayName("setRegenerate / setOk（updateStatus）")
    class UpdateStatusTest {

        @Test @DisplayName("setRegenerate-chnrがnull→400")
        void testRegenerateChnrNull() {
            validReq.setChnr(null);
            assertEquals(400, service.setRegenerate(validReq).getCode().intValue());
            verifyNoInteractions(ud15Mapper);
        }

        @Test @DisplayName("setRegenerate-chnrが空→400")
        void testRegenerateChnrEmpty() {
            validReq.setChnr("");
            assertEquals(400, service.setRegenerate(validReq).getCode().intValue());
            verifyNoInteractions(ud15Mapper);
        }

        @Test @DisplayName("setRegenerate-count=0→400 记录不存在")
        void testRegenerateCountZero() {
            when(ud15Mapper.countByChnr("JPCT", "013945")).thenReturn(0);
            assertEquals(400, service.setRegenerate(validReq).getCode().intValue());
            verify(ud15Mapper, never()).updateStatus(any(), any(), any(), any(), any());
        }

        @Test @DisplayName("setRegenerate-updateUserがnull→SYSTEMで更新成功")
        void testRegenerateUserNull() {
            validReq.setUpdateUser(null);
            when(ud15Mapper.countByChnr("JPCT", "013945")).thenReturn(1);
            when(ud15Mapper.updateStatus("JPCT", "013945", "0", "SYSTEM", "UD15_REGENERATE")).thenReturn(1);

            ApiResponse<?> resp = service.setRegenerate(validReq);
            assertEquals(200, resp.getCode().intValue());
            assertTrue(resp.getMsg().contains("设置重新生成成功"));
            verify(ud15Mapper).updateStatus("JPCT", "013945", "0", "SYSTEM", "UD15_REGENERATE");
        }

        @Test @DisplayName("setRegenerate-updateUserが空→SYSTEMで更新成功")
        void testRegenerateUserEmpty() {
            validReq.setUpdateUser("");
            when(ud15Mapper.countByChnr("JPCT", "013945")).thenReturn(1);
            when(ud15Mapper.updateStatus("JPCT", "013945", "0", "SYSTEM", "UD15_REGENERATE")).thenReturn(1);

            assertEquals(200, service.setRegenerate(validReq).getCode().intValue());
            verify(ud15Mapper).updateStatus("JPCT", "013945", "0", "SYSTEM", "UD15_REGENERATE");
        }

        @Test @DisplayName("setRegenerate-正常系→200 设置重新生成成功")
        void testRegenerateSuccess() {
            when(ud15Mapper.countByChnr("JPCT", "013945")).thenReturn(1);
            when(ud15Mapper.updateStatus("JPCT", "013945", "0", "admin", "UD15_REGENERATE")).thenReturn(1);

            ApiResponse<?> resp = service.setRegenerate(validReq);
            assertEquals(200, resp.getCode().intValue());
            assertTrue(resp.getMsg().contains("设置重新生成成功"));
        }

        @Test @DisplayName("setRegenerate-updateStatusが0→500 更新失败")
        void testRegenerateUpdateFails() {
            when(ud15Mapper.countByChnr("JPCT", "013945")).thenReturn(1);
            when(ud15Mapper.updateStatus("JPCT", "013945", "0", "admin", "UD15_REGENERATE")).thenReturn(0);

            assertEquals(500, service.setRegenerate(validReq).getCode().intValue());
        }

        @Test @DisplayName("setOk-正常系→200 设置OK成功")
        void testSetOkSuccess() {
            when(ud15Mapper.countByChnr("JPCT", "013945")).thenReturn(1);
            when(ud15Mapper.updateStatus("JPCT", "013945", "1", "admin", "UD15_SET_OK")).thenReturn(1);

            ApiResponse<?> resp = service.setOk(validReq);
            assertEquals(200, resp.getCode().intValue());
            assertTrue(resp.getMsg().contains("设置OK成功"));
        }

        @Test @DisplayName("setOk-updateStatusが0→500")
        void testSetOkUpdateFails() {
            when(ud15Mapper.countByChnr("JPCT", "013945")).thenReturn(1);
            when(ud15Mapper.updateStatus("JPCT", "013945", "1", "admin", "UD15_SET_OK")).thenReturn(0);

            assertEquals(500, service.setOk(validReq).getCode().intValue());
        }

        @Test @DisplayName("updateStatus-例外→500")
        void testUpdateStatusException() {
            when(ud15Mapper.countByChnr("JPCT", "013945")).thenThrow(new RuntimeException());
            assertEquals(500, service.setRegenerate(validReq).getCode().intValue());
        }
    }

    // ========================================================================
    // changeToBasicInfo / changeToAdvancedInfo（updateStatusAndType経由）
    // ========================================================================
    @Nested
    @DisplayName("changeToBasicInfo / changeToAdvancedInfo（updateStatusAndType）")
    class UpdateStatusAndTypeTest {

        @Test @DisplayName("changeToBasic-chnrがnull→400")
        void testBasicChnrNull() {
            validReq.setChnr(null);
            assertEquals(400, service.changeToBasicInfo(validReq).getCode().intValue());
            verifyNoInteractions(ud15Mapper);
        }

        @Test @DisplayName("changeToBasic-chnrが空→400")
        void testBasicChnrEmpty() {
            validReq.setChnr("");
            assertEquals(400, service.changeToBasicInfo(validReq).getCode().intValue());
            verifyNoInteractions(ud15Mapper);
        }

        @Test @DisplayName("changeToBasic-count=0→400 记录不存在")
        void testBasicCountZero() {
            when(ud15Mapper.countByChnr("JPCT", "013945")).thenReturn(0);
            assertEquals(400, service.changeToBasicInfo(validReq).getCode().intValue());
        }

        @Test @DisplayName("changeToBasic-正常系→200 切换到基础信息成功")
        void testBasicSuccess() {
            when(ud15Mapper.countByChnr("JPCT", "013945")).thenReturn(1);
            when(ud15Mapper.updateStatusAndType("JPCT", "013945", "0", "1", "admin", "UD15_CHANGE_BASIC")).thenReturn(1);

            ApiResponse<?> resp = service.changeToBasicInfo(validReq);
            assertEquals(200, resp.getCode().intValue());
            assertTrue(resp.getMsg().contains("切换到基础信息成功"));
        }

        @Test @DisplayName("changeToBasic-updateStatusAndTypeが0→500")
        void testBasicUpdateFails() {
            when(ud15Mapper.countByChnr("JPCT", "013945")).thenReturn(1);
            when(ud15Mapper.updateStatusAndType("JPCT", "013945", "0", "1", "admin", "UD15_CHANGE_BASIC")).thenReturn(0);

            assertEquals(500, service.changeToBasicInfo(validReq).getCode().intValue());
        }

        @Test @DisplayName("changeToAdvanced-正常系→200 切换到高级信息成功")
        void testAdvancedSuccess() {
            when(ud15Mapper.countByChnr("JPCT", "013945")).thenReturn(1);
            when(ud15Mapper.updateStatusAndType("JPCT", "013945", "0", "2", "admin", "UD15_CHANGE_ADVANCED")).thenReturn(1);

            ApiResponse<?> resp = service.changeToAdvancedInfo(validReq);
            assertEquals(200, resp.getCode().intValue());
            assertTrue(resp.getMsg().contains("切换到高级信息成功"));
        }

        @Test @DisplayName("changeToAdvanced-updateStatusAndTypeが0→500")
        void testAdvancedUpdateFails() {
            when(ud15Mapper.countByChnr("JPCT", "013945")).thenReturn(1);
            when(ud15Mapper.updateStatusAndType("JPCT", "013945", "0", "2", "admin", "UD15_CHANGE_ADVANCED")).thenReturn(0);

            assertEquals(500, service.changeToAdvancedInfo(validReq).getCode().intValue());
        }

        @Test @DisplayName("changeToAdvanced-updateUserがnull→SYSTEM")
        void testAdvancedUserNull() {
            validReq.setUpdateUser(null);
            when(ud15Mapper.countByChnr("JPCT", "013945")).thenReturn(1);
            when(ud15Mapper.updateStatusAndType("JPCT", "013945", "0", "2", "SYSTEM", "UD15_CHANGE_ADVANCED")).thenReturn(1);

            assertEquals(200, service.changeToAdvancedInfo(validReq).getCode().intValue());
            verify(ud15Mapper).updateStatusAndType("JPCT", "013945", "0", "2", "SYSTEM", "UD15_CHANGE_ADVANCED");
        }

        @Test @DisplayName("changeToAdvanced-updateUserが空→SYSTEM")
        void testAdvancedUserEmpty() {
            validReq.setUpdateUser("");
            when(ud15Mapper.countByChnr("JPCT", "013945")).thenReturn(1);
            when(ud15Mapper.updateStatusAndType("JPCT", "013945", "0", "2", "SYSTEM", "UD15_CHANGE_ADVANCED")).thenReturn(1);

            assertEquals(200, service.changeToAdvancedInfo(validReq).getCode().intValue());
            verify(ud15Mapper).updateStatusAndType("JPCT", "013945", "0", "2", "SYSTEM", "UD15_CHANGE_ADVANCED");
        }

        @Test @DisplayName("updateStatusAndType-例外→500")
        void testException() {
            when(ud15Mapper.countByChnr("JPCT", "013945")).thenThrow(new RuntimeException());
            assertEquals(500, service.changeToBasicInfo(validReq).getCode().intValue());
        }
    }
}
