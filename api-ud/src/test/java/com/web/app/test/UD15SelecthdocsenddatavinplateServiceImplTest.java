package com.web.app.test;

import com.web.app.dto.UD15SelecthdocsenddatavinplateRequest;
import com.web.app.dto.UD15SelecthdocsenddatavinplateResponse;
import com.web.app.entity.HdocSendDataVinPlate;
import com.web.app.mapper.UD15SelecthdocsenddatavinplateMapper;
import com.web.app.service.impl.UD15SelecthdocsenddatavinplateServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD15SelecthdocsenddatavinplateServiceImpl 单元测试
 * 覆盖5个业务方法的所有分支，达到 100% JaCoCo 覆盖率
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD15SelecthdocsenddatavinplateServiceImpl 单元测试")
class UD15SelecthdocsenddatavinplateServiceImplTest {

    @Mock
    private UD15SelecthdocsenddatavinplateMapper ud15Mapper;

    @InjectMocks
    private UD15SelecthdocsenddatavinplateServiceImpl service;

    // ====================================================================
    // validateChassisParams 公共校验（被所有5个方法调用）
    // ====================================================================

    // ====================================================================
    // UD15ViewInfo 测试
    // ====================================================================

    @Test
    @DisplayName("[ViewInfo] chassisSerie 为 null 时应返回400")
    void testViewInfo_ChassisSerieNull() {
        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest(null, "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ViewInfo(request);
        assertEquals(400, response.getCode());
        assertEquals("底盘系列和底盘编号不能为空", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[ViewInfo] chassisNo 为 null 时应返回400")
    void testViewInfo_ChassisNoNull() {
        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", null);
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ViewInfo(request);
        assertEquals(400, response.getCode());
        assertEquals("底盘系列和底盘编号不能为空", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[ViewInfo] chassisSerie 为空字符串时应返回400")
    void testViewInfo_ChassisSerieEmpty() {
        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ViewInfo(request);
        assertEquals(400, response.getCode());
        assertEquals("底盘系列和底盘编号不能为空", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[ViewInfo] chassisNo 为空字符串时应返回400")
    void testViewInfo_ChassisNoEmpty() {
        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ViewInfo(request);
        assertEquals(400, response.getCode());
        assertEquals("底盘系列和底盘编号不能为空", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[ViewInfo] vinPlate 为 null 时应返回404")
    void testViewInfo_VinPlateNull() {
        when(ud15Mapper.selectVinPlateInfo("ABC12", "12345")).thenReturn(null);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ViewInfo(request);

        assertEquals(404, response.getCode());
        assertEquals("记录不存在", response.getMsg());
        assertNull(response.getData());
        verify(ud15Mapper, times(1)).selectVinPlateInfo("ABC12", "12345");
    }

    @Test
    @DisplayName("[ViewInfo] xmlDoc 为 null 时应返回空列表")
    void testViewInfo_XmlDocNull() {
        HdocSendDataVinPlate vinPlate = createBaseVinPlate();
        vinPlate.setXmlDoc(null);
        when(ud15Mapper.selectVinPlateInfo("ABC12", "12345")).thenReturn(vinPlate);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ViewInfo(request);

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());
        UD15SelecthdocsenddatavinplateResponse.VinPlateInfoData data = (UD15SelecthdocsenddatavinplateResponse.VinPlateInfoData) response
                .getData();
        assertEquals("12345", data.getChassisNumber());
        assertNotNull(data.getPrintItems());
        assertTrue(data.getPrintItems().isEmpty());
        assertNotNull(data.getVpData());
        assertTrue(data.getVpData().isEmpty());
    }

    @Test
    @DisplayName("[ViewInfo] xmlDoc 为空字符串时应返回空列表")
    void testViewInfo_XmlDocEmpty() {
        HdocSendDataVinPlate vinPlate = createBaseVinPlate();
        vinPlate.setXmlDoc("");
        when(ud15Mapper.selectVinPlateInfo("ABC12", "12345")).thenReturn(vinPlate);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ViewInfo(request);

        assertEquals(200, response.getCode());
        UD15SelecthdocsenddatavinplateResponse.VinPlateInfoData data = (UD15SelecthdocsenddatavinplateResponse.VinPlateInfoData) response
                .getData();
        assertTrue(data.getPrintItems().isEmpty());
        assertTrue(data.getVpData().isEmpty());
    }

    @Test
    @DisplayName("[ViewInfo] xmlDoc 为空白字符串时应返回空列表")
    void testViewInfo_XmlDocBlank() {
        HdocSendDataVinPlate vinPlate = createBaseVinPlate();
        vinPlate.setXmlDoc("   ");
        when(ud15Mapper.selectVinPlateInfo("ABC12", "12345")).thenReturn(vinPlate);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ViewInfo(request);

        assertEquals(200, response.getCode());
        UD15SelecthdocsenddatavinplateResponse.VinPlateInfoData data = (UD15SelecthdocsenddatavinplateResponse.VinPlateInfoData) response
                .getData();
        assertTrue(data.getPrintItems().isEmpty());
        assertTrue(data.getVpData().isEmpty());
    }

    @Test
    @DisplayName("[ViewInfo] xmlDoc 仅1个token（不足2）时应无 printItems 和 vpData")
    void testViewInfo_XmlDocSingleToken() {
        HdocSendDataVinPlate vinPlate = createBaseVinPlate();
        vinPlate.setXmlDoc("OnlyOne");
        when(ud15Mapper.selectVinPlateInfo("ABC12", "12345")).thenReturn(vinPlate);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ViewInfo(request);

        assertEquals(200, response.getCode());
        UD15SelecthdocsenddatavinplateResponse.VinPlateInfoData data = (UD15SelecthdocsenddatavinplateResponse.VinPlateInfoData) response
                .getData();
        assertTrue(data.getPrintItems().isEmpty());
        assertTrue(data.getVpData().isEmpty());
    }

    @Test
    @DisplayName("[ViewInfo] xmlDoc 含2个token时应只有 printItems，无 vpData")
    void testViewInfo_XmlDocTwoTokens() {
        HdocSendDataVinPlate vinPlate = createBaseVinPlate();
        vinPlate.setXmlDoc("PrintName PrintValue");
        when(ud15Mapper.selectVinPlateInfo("ABC12", "12345")).thenReturn(vinPlate);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ViewInfo(request);

        assertEquals(200, response.getCode());
        UD15SelecthdocsenddatavinplateResponse.VinPlateInfoData data = (UD15SelecthdocsenddatavinplateResponse.VinPlateInfoData) response
                .getData();
        assertEquals(1, data.getPrintItems().size());
        assertEquals("PrintName", data.getPrintItems().get(0).getName());
        assertEquals("PrintValue", data.getPrintItems().get(0).getValue());
        assertTrue(data.getVpData().isEmpty());
    }

    @Test
    @DisplayName("[ViewInfo] xmlDoc 含4个tokens（2 print + 2 vp）时应正确解析")
    void testViewInfo_XmlDocFourTokens() {
        HdocSendDataVinPlate vinPlate = createBaseVinPlate();
        vinPlate.setXmlDoc("PrintName PrintValue vpName1 vpValue1");
        when(ud15Mapper.selectVinPlateInfo("ABC12", "12345")).thenReturn(vinPlate);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ViewInfo(request);

        assertEquals(200, response.getCode());
        UD15SelecthdocsenddatavinplateResponse.VinPlateInfoData data = (UD15SelecthdocsenddatavinplateResponse.VinPlateInfoData) response
                .getData();
        assertEquals(1, data.getPrintItems().size());
        assertEquals(1, data.getVpData().size());
        assertEquals("vpName1", data.getVpData().get(0).getVariantName());
        assertEquals("vpValue1", data.getVpData().get(0).getValue());
    }

    @Test
    @DisplayName("[ViewInfo] xmlDoc 含奇数个额外token时应追加到最后 vpData 的 value 中")
    void testViewInfo_XmlDocOddRemainingToken() {
        // tokens: [PName PValue vpN1 vpV1 vpN2 vpV2 extra]
        // printItems: (PName, PValue)
        // vpData: (vpN1, vpV1), (vpN2, vpV2)
        // remaining odd token "extra" → append to last vpData: (vpN2, "vpV2 extra")
        HdocSendDataVinPlate vinPlate = createBaseVinPlate();
        vinPlate.setXmlDoc("PName PValue vpN1 vpV1 vpN2 vpV2 extra");
        when(ud15Mapper.selectVinPlateInfo("ABC12", "12345")).thenReturn(vinPlate);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ViewInfo(request);

        assertEquals(200, response.getCode());
        UD15SelecthdocsenddatavinplateResponse.VinPlateInfoData data = (UD15SelecthdocsenddatavinplateResponse.VinPlateInfoData) response
                .getData();
        assertEquals(1, data.getPrintItems().size());
        assertEquals("PName", data.getPrintItems().get(0).getName());
        assertEquals(2, data.getVpData().size());
        assertEquals("vpN1", data.getVpData().get(0).getVariantName());
        assertEquals("vpV1", data.getVpData().get(0).getValue());
        assertEquals("vpN2", data.getVpData().get(1).getVariantName());
        assertEquals("vpV2 extra", data.getVpData().get(1).getValue());
    }

    @Test
    @DisplayName("[ViewInfo] xmlDoc 含3个tokens（2 print + 1 奇数）时仅解析 printItem")
    void testViewInfo_XmlDocThreeTokens() {
        // tokens: [PName PValue oddOne]
        // printItems: (PName, PValue)
        // loop: i=2, i+1=3, tokens.length=3 → 3<3 false → 不执行
        // odd check: (3-2)%2==1 → true, lastIdx = -1 → lastIdx>=0 false → 跳过
        HdocSendDataVinPlate vinPlate = createBaseVinPlate();
        vinPlate.setXmlDoc("PName PValue oddOne");
        when(ud15Mapper.selectVinPlateInfo("ABC12", "12345")).thenReturn(vinPlate);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ViewInfo(request);

        assertEquals(200, response.getCode());
        UD15SelecthdocsenddatavinplateResponse.VinPlateInfoData data = (UD15SelecthdocsenddatavinplateResponse.VinPlateInfoData) response
                .getData();
        assertEquals(1, data.getPrintItems().size());
        assertTrue(data.getVpData().isEmpty());
    }

    @Test
    @DisplayName("[ViewInfo] 系统异常时应返回500")
    void testViewInfo_Exception() {
        when(ud15Mapper.selectVinPlateInfo(anyString(), anyString()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ViewInfo(request);

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
        verify(ud15Mapper, times(1)).selectVinPlateInfo("ABC12", "12345");
    }

    // ====================================================================
    // UD15SetRegenerate 测试
    // ====================================================================

    @Test
    @DisplayName("[SetRegenerate] chassisSerie 为空时应返回400")
    void testSetRegenerate_ValidationError() {
        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15SetRegenerate(request);
        assertEquals(400, response.getCode());
        assertEquals("底盘系列和底盘编号不能为空", response.getMsg());
    }

    @Test
    @DisplayName("[SetRegenerate] vinPlate 为 null 时应返回404")
    void testSetRegenerate_VinPlateNull() {
        when(ud15Mapper.selectVinPlateInfo("ABC12", "12345")).thenReturn(null);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15SetRegenerate(request);

        assertEquals(404, response.getCode());
        assertEquals("记录不存在，无法更新", response.getMsg());
        assertNull(response.getData());
        verify(ud15Mapper, times(1)).selectVinPlateInfo("ABC12", "12345");
        verify(ud15Mapper, never()).updateStatusRegenerate(any(), any());
    }

    @Test
    @DisplayName("[SetRegenerate] update 结果为空时应返回500")
    void testSetRegenerate_ResultNull() {
        HdocSendDataVinPlate vinPlate = createBaseVinPlate();
        when(ud15Mapper.selectVinPlateInfo("ABC12", "12345")).thenReturn(vinPlate);
        when(ud15Mapper.updateStatusRegenerate("ABC12", "12345")).thenReturn(null);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15SetRegenerate(request);

        assertEquals(500, response.getCode());
        assertEquals("更新失败", response.getMsg());
        assertNull(response.getData());
        verify(ud15Mapper, times(1)).selectVinPlateInfo("ABC12", "12345");
        verify(ud15Mapper, times(1)).updateStatusRegenerate("ABC12", "12345");
    }

    @Test
    @DisplayName("[SetRegenerate] update 结果为0时应返回500")
    void testSetRegenerate_ResultZero() {
        HdocSendDataVinPlate vinPlate = createBaseVinPlate();
        when(ud15Mapper.selectVinPlateInfo("ABC12", "12345")).thenReturn(vinPlate);
        when(ud15Mapper.updateStatusRegenerate("ABC12", "12345")).thenReturn(0);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15SetRegenerate(request);

        assertEquals(500, response.getCode());
        assertEquals("更新失败", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[SetRegenerate] 更新成功时应返回200")
    void testSetRegenerate_Success() {
        HdocSendDataVinPlate vinPlate = createBaseVinPlate();
        when(ud15Mapper.selectVinPlateInfo("ABC12", "12345")).thenReturn(vinPlate);
        when(ud15Mapper.updateStatusRegenerate("ABC12", "12345")).thenReturn(1);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15SetRegenerate(request);

        assertEquals(200, response.getCode());
        assertEquals("状态已更新为重新生成", response.getMsg());
        assertNull(response.getData());
        verify(ud15Mapper, times(1)).selectVinPlateInfo("ABC12", "12345");
        verify(ud15Mapper, times(1)).updateStatusRegenerate("ABC12", "12345");
    }

    @Test
    @DisplayName("[SetRegenerate] 系统异常时应返回500")
    void testSetRegenerate_Exception() {
        when(ud15Mapper.selectVinPlateInfo(anyString(), anyString()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15SetRegenerate(request);

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
    }

    // ====================================================================
    // UD15SetOK 测试
    // ====================================================================

    @Test
    @DisplayName("[SetOK] 校验失败时应返回400")
    void testSetOK_ValidationError() {
        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest(null, "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15SetOK(request);
        assertEquals(400, response.getCode());
        assertEquals("底盘系列和底盘编号不能为空", response.getMsg());
    }

    @Test
    @DisplayName("[SetOK] update 结果为 null 时应返回500")
    void testSetOK_ResultNull() {
        when(ud15Mapper.updateStatusSetOk("ABC12", "12345")).thenReturn(null);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15SetOK(request);

        assertEquals(500, response.getCode());
        assertEquals("更新失败", response.getMsg());
        assertNull(response.getData());
        verify(ud15Mapper, times(1)).updateStatusSetOk("ABC12", "12345");
    }

    @Test
    @DisplayName("[SetOK] update 结果为0时应返回500")
    void testSetOK_ResultZero() {
        when(ud15Mapper.updateStatusSetOk("ABC12", "12345")).thenReturn(0);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15SetOK(request);

        assertEquals(500, response.getCode());
        assertEquals("更新失败", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[SetOK] 更新成功时应返回200")
    void testSetOK_Success() {
        when(ud15Mapper.updateStatusSetOk("ABC12", "12345")).thenReturn(1);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15SetOK(request);

        assertEquals(200, response.getCode());
        assertEquals("状态已更新为OK", response.getMsg());
        assertNull(response.getData());
        verify(ud15Mapper, times(1)).updateStatusSetOk("ABC12", "12345");
    }

    @Test
    @DisplayName("[SetOK] 系统异常时应返回500")
    void testSetOK_Exception() {
        when(ud15Mapper.updateStatusSetOk(anyString(), anyString()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15SetOK(request);

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
    }

    // ====================================================================
    // UD15ChangetoBasicInfo 测试
    // ====================================================================

    @Test
    @DisplayName("[ChangeBasic] 校验失败时应返回400")
    void testChangeBasic_ValidationError() {
        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ChangetoBasicInfo(request);
        assertEquals(400, response.getCode());
        assertEquals("底盘系列和底盘编号不能为空", response.getMsg());
    }

    @Test
    @DisplayName("[ChangeBasic] update 结果为 null 时应返回500")
    void testChangeBasic_ResultNull() {
        when(ud15Mapper.updateStatusChangeBasic("ABC12", "12345")).thenReturn(null);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ChangetoBasicInfo(request);

        assertEquals(500, response.getCode());
        assertEquals("更新失败", response.getMsg());
        assertNull(response.getData());
        verify(ud15Mapper, times(1)).updateStatusChangeBasic("ABC12", "12345");
    }

    @Test
    @DisplayName("[ChangeBasic] update 结果为0时应返回500")
    void testChangeBasic_ResultZero() {
        when(ud15Mapper.updateStatusChangeBasic("ABC12", "12345")).thenReturn(0);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ChangetoBasicInfo(request);

        assertEquals(500, response.getCode());
        assertEquals("更新失败", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[ChangeBasic] 更新成功时应返回200")
    void testChangeBasic_Success() {
        when(ud15Mapper.updateStatusChangeBasic("ABC12", "12345")).thenReturn(1);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ChangetoBasicInfo(request);

        assertEquals(200, response.getCode());
        assertEquals("已切换到基本信息", response.getMsg());
        assertNull(response.getData());
        verify(ud15Mapper, times(1)).updateStatusChangeBasic("ABC12", "12345");
    }

    @Test
    @DisplayName("[ChangeBasic] 系统异常时应返回500")
    void testChangeBasic_Exception() {
        when(ud15Mapper.updateStatusChangeBasic(anyString(), anyString()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ChangetoBasicInfo(request);

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
    }

    // ====================================================================
    // UD15ChangetoAdvancedInfo 测试
    // ====================================================================

    @Test
    @DisplayName("[ChangeAdvanced] 校验失败时应返回400")
    void testChangeAdvanced_ValidationError() {
        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", null);
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ChangetoAdvancedInfo(request);
        assertEquals(400, response.getCode());
        assertEquals("底盘系列和底盘编号不能为空", response.getMsg());
    }

    @Test
    @DisplayName("[ChangeAdvanced] update 结果为 null 时应返回500")
    void testChangeAdvanced_ResultNull() {
        when(ud15Mapper.updateStatusChangeAdvanced("ABC12", "12345")).thenReturn(null);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ChangetoAdvancedInfo(request);

        assertEquals(500, response.getCode());
        assertEquals("更新失败", response.getMsg());
        assertNull(response.getData());
        verify(ud15Mapper, times(1)).updateStatusChangeAdvanced("ABC12", "12345");
    }

    @Test
    @DisplayName("[ChangeAdvanced] update 结果为0时应返回500")
    void testChangeAdvanced_ResultZero() {
        when(ud15Mapper.updateStatusChangeAdvanced("ABC12", "12345")).thenReturn(0);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ChangetoAdvancedInfo(request);

        assertEquals(500, response.getCode());
        assertEquals("更新失败", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[ChangeAdvanced] 更新成功时应返回200")
    void testChangeAdvanced_Success() {
        when(ud15Mapper.updateStatusChangeAdvanced("ABC12", "12345")).thenReturn(1);

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ChangetoAdvancedInfo(request);

        assertEquals(200, response.getCode());
        assertEquals("已切换到高级信息", response.getMsg());
        assertNull(response.getData());
        verify(ud15Mapper, times(1)).updateStatusChangeAdvanced("ABC12", "12345");
    }

    @Test
    @DisplayName("[ChangeAdvanced] 系统异常时应返回500")
    void testChangeAdvanced_Exception() {
        when(ud15Mapper.updateStatusChangeAdvanced(anyString(), anyString()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest("ABC12", "12345");
        UD15SelecthdocsenddatavinplateResponse response = service.UD15ChangetoAdvancedInfo(request);

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
    }

    // ==================== 辅助方法 ====================

    private HdocSendDataVinPlate createBaseVinPlate() {
        HdocSendDataVinPlate vp = new HdocSendDataVinPlate();
        vp.setSerie("ABC12");
        vp.setChnr("12345");
        vp.setType("1");
        vp.setStatus("0");
        vp.setMsg("");
        vp.setRegisterDatetime(LocalDateTime.of(2026, 5, 20, 10, 30, 0));
        vp.setDocReady("Y");
        vp.setDocSent("N");
        vp.setXmlDoc("PrintItemName 82644192");
        return vp;
    }
}
