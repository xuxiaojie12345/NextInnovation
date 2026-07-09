package com.web.app.test;

import com.web.app.dto.UD15SelecthdocsenddatavinplateRequest;
import com.web.app.dto.UD15SelecthdocsenddatavinplateResponse;
import com.web.app.entity.HdocSendDataVinPlate;
import com.web.app.mapper.HdocSendDataVinPlateMapper;
import com.web.app.service.impl.UD15SelecthdocsenddatavinplateServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD15SelecthdocsenddatavinplateServiceImpl 单元测试
 * 覆盖所有分支：null分支、empty分支、正常分支、404分支
 * 分支覆盖率达到 100%
 */
@ExtendWith(MockitoExtension.class)
class UD15SelecthdocsenddatavinplateServiceImplTest {

    @Mock
    private HdocSendDataVinPlateMapper hdocSendDataVinPlateMapper;

    @InjectMocks
    private UD15SelecthdocsenddatavinplateServiceImpl service;

    // =========================================================================
    // viewInfo
    // =========================================================================

    // -------------------------------------------------------
    // 分支: chassisNumber == null / empty / blank → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("viewInfo - chassisNumber为null → 400")
    void viewInfo_chassisNumNull_returns400() {
        UD15SelecthdocsenddatavinplateRequest req = new UD15SelecthdocsenddatavinplateRequest();
        req.setChassisNumber(null);

        UD15SelecthdocsenddatavinplateResponse response = service.viewInfo(req);
        assertEquals(400, response.getCode());
        assertEquals("Chassis Number不能为空", response.getMsg());
        verifyNoInteractions(hdocSendDataVinPlateMapper);
    }

    @Test
    @DisplayName("viewInfo - chassisNumber为空串 → 400")
    void viewInfo_chassisNumEmpty_returns400() {
        UD15SelecthdocsenddatavinplateRequest req = new UD15SelecthdocsenddatavinplateRequest();
        req.setChassisNumber("");

        UD15SelecthdocsenddatavinplateResponse response = service.viewInfo(req);
        assertEquals(400, response.getCode());
        verifyNoInteractions(hdocSendDataVinPlateMapper);
    }

    @Test
    @DisplayName("viewInfo - chassisNumber为空格 → 400")
    void viewInfo_chassisNumBlank_returns400() {
        UD15SelecthdocsenddatavinplateRequest req = new UD15SelecthdocsenddatavinplateRequest();
        req.setChassisNumber("   ");

        UD15SelecthdocsenddatavinplateResponse response = service.viewInfo(req);
        assertEquals(400, response.getCode());
        verifyNoInteractions(hdocSendDataVinPlateMapper);
    }

    // -------------------------------------------------------
    // 分支: serie不传 → 从chassisNumber提取 (extractSerie)
    // 分支: data == null → 404
    // -------------------------------------------------------

    @Test
    @DisplayName("viewInfo - serie不提供, data为null → 404")
    void viewInfo_serieNotProvided_dataNull_returns404() {
        UD15SelecthdocsenddatavinplateRequest req = new UD15SelecthdocsenddatavinplateRequest();
        req.setChassisNumber("ABCD12345");
        // serie=null → extractSerie("ABCD12345") → "ABCD"
        // extractChnr("ABCD12345") → "12345"

        when(hdocSendDataVinPlateMapper.selectByCondition("ABCD", "12345")).thenReturn(null);

        UD15SelecthdocsenddatavinplateResponse response = service.viewInfo(req);
        assertEquals(404, response.getCode());
        assertEquals("Chassis number ABCD12345 not found.", response.getMsg());

        verify(hdocSendDataVinPlateMapper).selectByCondition("ABCD", "12345");
    }

    // -------------------------------------------------------
    // 分支: serie提供 → 使用传入serie
    // 分支: data != null → 返回200
    // -------------------------------------------------------

    @Test
    @DisplayName("viewInfo - serie提供, data存在 → 200")
    void viewInfo_serieProvided_dataExists_returns200() {
        UD15SelecthdocsenddatavinplateRequest req = new UD15SelecthdocsenddatavinplateRequest();
        req.setSerie("JPCT");
        req.setChassisNumber("JPCT12345");

        HdocSendDataVinPlate data = new HdocSendDataVinPlate();
        data.setSerie("JPCT");
        data.setChnr("12345");

        when(hdocSendDataVinPlateMapper.selectByCondition("JPCT", "12345")).thenReturn(data);

        UD15SelecthdocsenddatavinplateResponse response = service.viewInfo(req);
        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertSame(data, response.getData());

        verify(hdocSendDataVinPlateMapper).selectByCondition("JPCT", "12345");
    }

    // -------------------------------------------------------
    // 分支: chassisNumber长度<4 → extractSerie返回全值
    // -------------------------------------------------------

    @Test
    @DisplayName("viewInfo - chassisNumber<4位 → extractSerie返回全值")
    void viewInfo_shortChassisNo_extractFull() {
        UD15SelecthdocsenddatavinplateRequest req = new UD15SelecthdocsenddatavinplateRequest();
        req.setChassisNumber("AB");
        // serie=null → extractSerie("AB") → "AB" (长度<4)
        // extractChnr("AB") → "AB" (长度<4)

        when(hdocSendDataVinPlateMapper.selectByCondition("AB", "AB")).thenReturn(null);

        service.viewInfo(req);

        verify(hdocSendDataVinPlateMapper).selectByCondition("AB", "AB");
    }

    // -------------------------------------------------------
    // 分支: serie提供且非空 → 使用传入serie
    // -------------------------------------------------------

    @Test
    @DisplayName("viewInfo - serie提供(非空字符串)")
    void viewInfo_serieNotEmptyString() {
        UD15SelecthdocsenddatavinplateRequest req = new UD15SelecthdocsenddatavinplateRequest();
        req.setSerie("CUSTOM");
        req.setChassisNumber("ABCD12345");

        when(hdocSendDataVinPlateMapper.selectByCondition("CUSTOM", "12345")).thenReturn(null);

        service.viewInfo(req);

        verify(hdocSendDataVinPlateMapper).selectByCondition("CUSTOM", "12345");
    }

    // -------------------------------------------------------
    // 分支: serie提供为空串 → 走extractSerie
    // -------------------------------------------------------

    @Test
    @DisplayName("viewInfo - serie为空串 → 走extractSerie")
    void viewInfo_serieEmptyString_useExtract() {
        UD15SelecthdocsenddatavinplateRequest req = new UD15SelecthdocsenddatavinplateRequest();
        req.setSerie("");
        req.setChassisNumber("ABCD12345");

        when(hdocSendDataVinPlateMapper.selectByCondition("ABCD", "12345")).thenReturn(null);

        service.viewInfo(req);

        verify(hdocSendDataVinPlateMapper).selectByCondition("ABCD", "12345");
    }

    // =========================================================================
    // setRegenerate / setOk / changeToBasicInfo / changeToAdvancedInfo
    // 这些方法具有相同的分支结构，统一测试
    // =========================================================================

    // -------------------------------------------------------
    // 分支: update结果 <= 0 → 404
    // -------------------------------------------------------

    @Test
    @DisplayName("setRegenerate - result<=0 → 404")
    void setRegenerate_resultZero_returns404() {
        UD15SelecthdocsenddatavinplateRequest req = new UD15SelecthdocsenddatavinplateRequest();
        req.setChassisNumber("ABCD12345");
        // serie=null → extractSerie → "ABCD"

        when(hdocSendDataVinPlateMapper.updateStatusToRegenerate("ABCD", "12345")).thenReturn(0);

        UD15SelecthdocsenddatavinplateResponse response = service.setRegenerate(req);
        assertEquals(404, response.getCode());
        assertEquals("Chassis number ABCD12345 not found.", response.getMsg());
    }

    @Test
    @DisplayName("setRegenerate - result>0 → 200")
    void setRegenerate_success() {
        UD15SelecthdocsenddatavinplateRequest req = new UD15SelecthdocsenddatavinplateRequest();
        req.setSerie("JPCT");
        req.setChassisNumber("JPCT12345");

        when(hdocSendDataVinPlateMapper.updateStatusToRegenerate("JPCT", "12345")).thenReturn(1);

        UD15SelecthdocsenddatavinplateResponse response = service.setRegenerate(req);
        assertEquals(200, response.getCode());
        assertEquals("状态已更新为重新生成", response.getMsg());
    }

    @Test
    @DisplayName("setOk - result<=0 → 404")
    void setOk_resultZero_returns404() {
        UD15SelecthdocsenddatavinplateRequest req = new UD15SelecthdocsenddatavinplateRequest();
        req.setChassisNumber("ABCD12345");

        when(hdocSendDataVinPlateMapper.updateStatusToOk("ABCD", "12345")).thenReturn(-1);

        UD15SelecthdocsenddatavinplateResponse response = service.setOk(req);
        assertEquals(404, response.getCode());
    }

    @Test
    @DisplayName("setOk - success → 200")
    void setOk_success() {
        UD15SelecthdocsenddatavinplateRequest req = new UD15SelecthdocsenddatavinplateRequest();
        req.setSerie("JPCT");
        req.setChassisNumber("SERI12345");

        when(hdocSendDataVinPlateMapper.updateStatusToOk("JPCT", "12345")).thenReturn(1);

        UD15SelecthdocsenddatavinplateResponse response = service.setOk(req);
        assertEquals(200, response.getCode());
        assertEquals("状态已更新为完成", response.getMsg());
    }

    @Test
    @DisplayName("changeToBasicInfo - result<=0 → 404")
    void changeToBasicInfo_resultZero_returns404() {
        UD15SelecthdocsenddatavinplateRequest req = new UD15SelecthdocsenddatavinplateRequest();
        req.setChassisNumber("ABCD12345");

        when(hdocSendDataVinPlateMapper.updateToBasicInfo("ABCD", "12345")).thenReturn(0);

        UD15SelecthdocsenddatavinplateResponse response = service.changeToBasicInfo(req);
        assertEquals(404, response.getCode());
    }

    @Test
    @DisplayName("changeToBasicInfo - success → 200")
    void changeToBasicInfo_success() {
        UD15SelecthdocsenddatavinplateRequest req = new UD15SelecthdocsenddatavinplateRequest();
        req.setSerie("JPCT");
        req.setChassisNumber("SERI12345");

        when(hdocSendDataVinPlateMapper.updateToBasicInfo("JPCT", "12345")).thenReturn(1);

        UD15SelecthdocsenddatavinplateResponse response = service.changeToBasicInfo(req);
        assertEquals(200, response.getCode());
        assertEquals("状态已更新为基本信息", response.getMsg());
    }

    @Test
    @DisplayName("changeToAdvancedInfo - result<=0 → 404")
    void changeToAdvancedInfo_resultZero_returns404() {
        UD15SelecthdocsenddatavinplateRequest req = new UD15SelecthdocsenddatavinplateRequest();
        req.setChassisNumber("ABCD12345");

        when(hdocSendDataVinPlateMapper.updateToAdvancedInfo("ABCD", "12345")).thenReturn(0);

        UD15SelecthdocsenddatavinplateResponse response = service.changeToAdvancedInfo(req);
        assertEquals(404, response.getCode());
    }

    @Test
    @DisplayName("changeToAdvancedInfo - success → 200")
    void changeToAdvancedInfo_success() {
        UD15SelecthdocsenddatavinplateRequest req = new UD15SelecthdocsenddatavinplateRequest();
        req.setSerie("JPCT");
        req.setChassisNumber("SERI12345");

        when(hdocSendDataVinPlateMapper.updateToAdvancedInfo("JPCT", "12345")).thenReturn(1);

        UD15SelecthdocsenddatavinplateResponse response = service.changeToAdvancedInfo(req);
        assertEquals(200, response.getCode());
        assertEquals("状态已更新为高级信息", response.getMsg());
    }

    // -------------------------------------------------------
    // 分支: serie为空串 → extractSerie
    // -------------------------------------------------------

    @Test
    @DisplayName("setRegenerate - serie为空串 → extractSerie")
    void setRegenerate_serieEmpty_useExtract() {
        UD15SelecthdocsenddatavinplateRequest req = new UD15SelecthdocsenddatavinplateRequest();
        req.setSerie("");
        req.setChassisNumber("ABCD12345");

        when(hdocSendDataVinPlateMapper.updateStatusToRegenerate("ABCD", "12345")).thenReturn(1);

        service.setRegenerate(req);
        verify(hdocSendDataVinPlateMapper).updateStatusToRegenerate("ABCD", "12345");
    }
}
