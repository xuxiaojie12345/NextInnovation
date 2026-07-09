package com.web.app.test;

import com.web.app.dto.UD16ADChangeRequest;
import com.web.app.dto.UD16ADChangeResponse;
import com.web.app.entity.HdocAdcaChange;
import com.web.app.mapper.HdocAdcaChangeMapper;
import com.web.app.service.impl.UD16ADChangeServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD16ADChangeServiceImpl 单元测试
 * 覆盖所有分支：null分支、empty分支、正常分支、存在/不存在分支
 * 分支覆盖率达到 100%
 */
@ExtendWith(MockitoExtension.class)
class UD16ADChangeServiceImplTest {

    @Mock
    private HdocAdcaChangeMapper hdocAdcaChangeMapper;

    @InjectMocks
    private UD16ADChangeServiceImpl service;

    @Captor
    private ArgumentCaptor<HdocAdcaChange> captor;

    // =========================================================================
    // selectHdocAdcaChange
    // =========================================================================

    // -------------------------------------------------------
    // 分支: serieChnr == null / empty / blank → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("selectHdocAdcaChange - serieChnr为null → 400")
    void select_serieChnrNull_returns400() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr(null);

        UD16ADChangeResponse response = service.selectHdocAdcaChange(req);
        assertEquals(400, response.getCode());
        assertEquals("参数不完整", response.getMsg());
        verifyNoInteractions(hdocAdcaChangeMapper);
    }

    @Test
    @DisplayName("selectHdocAdcaChange - serieChnr为空串 → 400")
    void select_serieChnrEmpty_returns400() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr("");

        UD16ADChangeResponse response = service.selectHdocAdcaChange(req);
        assertEquals(400, response.getCode());
        verifyNoInteractions(hdocAdcaChangeMapper);
    }

    @Test
    @DisplayName("selectHdocAdcaChange - serieChnr为空格 → 400")
    void select_serieChnrBlank_returns400() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr("   ");

        UD16ADChangeResponse response = service.selectHdocAdcaChange(req);
        assertEquals(400, response.getCode());
        verifyNoInteractions(hdocAdcaChangeMapper);
    }

    // -------------------------------------------------------
    // 分支: serieChnr有效 → 查询并返回data(可为null)
    // -------------------------------------------------------

    @Test
    @DisplayName("selectHdocAdcaChange - 查询data为null → 200, data=null")
    void select_dataNull_returns200() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr("ABCD12345");
        // extractSerie → "ABCD", extractChnr → "12345"

        when(hdocAdcaChangeMapper.selectByCondition("ABCD", "12345")).thenReturn(null);

        UD16ADChangeResponse response = service.selectHdocAdcaChange(req);
        assertEquals(200, response.getCode());
        assertEquals("没有错误", response.getMsg());
        assertNull(response.getData());

        verify(hdocAdcaChangeMapper).selectByCondition("ABCD", "12345");
    }

    @Test
    @DisplayName("selectHdocAdcaChange - 查询data存在 → 200, data返回")
    void select_dataExists_returns200() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr("ABCD12345");

        HdocAdcaChange data = new HdocAdcaChange();
        data.setSerie("ABCD");

        when(hdocAdcaChangeMapper.selectByCondition("ABCD", "12345")).thenReturn(data);

        UD16ADChangeResponse response = service.selectHdocAdcaChange(req);
        assertEquals(200, response.getCode());
        assertSame(data, response.getData());

        verify(hdocAdcaChangeMapper).selectByCondition("ABCD", "12345");
    }

    // -------------------------------------------------------
    // 分支: serieChnr长度<4 → extractSerie返回全值
    // -------------------------------------------------------

    @Test
    @DisplayName("selectHdocAdcaChange - serieChnr短于4位")
    void select_shortSerieChnr() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr("AB");

        when(hdocAdcaChangeMapper.selectByCondition("AB", "AB")).thenReturn(null);

        service.selectHdocAdcaChange(req);
        verify(hdocAdcaChangeMapper).selectByCondition("AB", "AB");
    }

    // =========================================================================
    // insertHdocAdcaChange
    // =========================================================================

    // -------------------------------------------------------
    // 分支: serieChnr为null/empty/blank → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("insertHdocAdcaChange - serieChnr为null → 400")
    void insert_serieChnrNull_returns400() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr(null);

        UD16ADChangeResponse response = service.insertHdocAdcaChange(req);
        assertEquals(400, response.getCode());
        assertEquals("参数不完整", response.getMsg());
        verifyNoInteractions(hdocAdcaChangeMapper);
    }

    @Test
    @DisplayName("insertHdocAdcaChange - serieChnr为空串 → 400")
    void insert_serieChnrEmpty_returns400() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr("");

        UD16ADChangeResponse response = service.insertHdocAdcaChange(req);
        assertEquals(400, response.getCode());
        assertEquals("参数不完整", response.getMsg());
        verifyNoInteractions(hdocAdcaChangeMapper);
    }

    @Test
    @DisplayName("insertHdocAdcaChange - serieChnr为空格 → 400")
    void insert_serieChnrBlank_returns400() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr("   ");

        UD16ADChangeResponse response = service.insertHdocAdcaChange(req);
        assertEquals(400, response.getCode());
        assertEquals("参数不完整", response.getMsg());
        verifyNoInteractions(hdocAdcaChangeMapper);
    }

    // -------------------------------------------------------
    // 分支: existing != null → 400 "AFTER DEF CHANGE IS NOT ACTIVATED"
    // -------------------------------------------------------

    @Test
    @DisplayName("insertHdocAdcaChange - 已存在 → 400")
    void insert_alreadyExists_returns400() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr("ABCD12345");

        HdocAdcaChange existing = new HdocAdcaChange();
        existing.setSerie("ABCD");
        when(hdocAdcaChangeMapper.selectByCondition("ABCD", "12345")).thenReturn(existing);

        UD16ADChangeResponse response = service.insertHdocAdcaChange(req);
        assertEquals(400, response.getCode());
        assertEquals("AFTER DEF CHANGE IS NOT ACTIVATED", response.getMsg());
        verify(hdocAdcaChangeMapper, never()).insert(any());
    }

    // -------------------------------------------------------
    // 分支: existing == null → 插入, bu/desc为null → 空串
    // -------------------------------------------------------

    @Test
    @DisplayName("insertHdocAdcaChange - 不存在, bu/desc为null → 插入成功")
    void insert_notExists_buDescNull_success() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr("ABCD12345");
        req.setBu(null);
        req.setDesc(null);
        req.setUser("TEST_USER");

        when(hdocAdcaChangeMapper.selectByCondition("ABCD", "12345")).thenReturn(null);

        UD16ADChangeResponse response = service.insertHdocAdcaChange(req);
        assertEquals(200, response.getCode());
        assertEquals("追加成功", response.getMsg());

        verify(hdocAdcaChangeMapper).insert(captor.capture());
        HdocAdcaChange captured = captor.getValue();
        assertEquals("ABCD", captured.getSerie());
        assertEquals("12345", captured.getChnr());
        assertEquals("Y", captured.getAct());
        assertEquals("", captured.getBu());     // null → ""
        assertEquals("", captured.getReason()); // null → ""
        assertEquals("TEST_USER", captured.getRegisterUser());
        assertEquals("TEST_USER", captured.getUpdateUser());
    }

    // -------------------------------------------------------
    // 分支: bu/desc提供值 → 使用传入值
    // -------------------------------------------------------

    @Test
    @DisplayName("insertHdocAdcaChange - bu/desc提供值, user为null")
    void insert_buDescProvided_userNull() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr("ABCD12345");
        req.setBu("BU001");
        req.setDesc("Test description");
        req.setUser(null);

        when(hdocAdcaChangeMapper.selectByCondition("ABCD", "12345")).thenReturn(null);

        service.insertHdocAdcaChange(req);

        verify(hdocAdcaChangeMapper).insert(captor.capture());
        HdocAdcaChange captured = captor.getValue();
        assertEquals("BU001", captured.getBu());
        assertEquals("Test description", captured.getReason());
        assertNull(captured.getRegisterUser());
        assertNull(captured.getUpdateUser());
    }

    // =========================================================================
    // updateHdocAdcaChange (逻辑删除)
    // =========================================================================

    // -------------------------------------------------------
    // 分支: serieChnr为null/empty/blank → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("updateHdocAdcaChange - serieChnr为null → 400")
    void update_serieChnrNull_returns400() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr(null);

        UD16ADChangeResponse response = service.updateHdocAdcaChange(req);
        assertEquals(400, response.getCode());
        assertEquals("参数不完整", response.getMsg());
        verifyNoInteractions(hdocAdcaChangeMapper);
    }

    @Test
    @DisplayName("updateHdocAdcaChange - serieChnr为空串 → 400")
    void update_serieChnrEmpty_returns400() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr("");

        UD16ADChangeResponse response = service.updateHdocAdcaChange(req);
        assertEquals(400, response.getCode());
        assertEquals("参数不完整", response.getMsg());
        verifyNoInteractions(hdocAdcaChangeMapper);
    }

    @Test
    @DisplayName("updateHdocAdcaChange - serieChnr为空格 → 400")
    void update_serieChnrBlank_returns400() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr("   ");

        UD16ADChangeResponse response = service.updateHdocAdcaChange(req);
        assertEquals(400, response.getCode());
        assertEquals("参数不完整", response.getMsg());
        verifyNoInteractions(hdocAdcaChangeMapper);
    }

    // -------------------------------------------------------
    // 分支: existing == null → 404
    // -------------------------------------------------------

    @Test
    @DisplayName("updateHdocAdcaChange - 记录不存在 → 404")
    void update_notExists_returns404() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr("ABCD12345");

        when(hdocAdcaChangeMapper.selectByCondition("ABCD", "12345")).thenReturn(null);

        UD16ADChangeResponse response = service.updateHdocAdcaChange(req);
        assertEquals(404, response.getCode());
        assertEquals("记录不存在", response.getMsg());
        verify(hdocAdcaChangeMapper, never()).updateActToN(anyString(), anyString());
    }

    // -------------------------------------------------------
    // 分支: existing != null → 逻辑删除成功
    // -------------------------------------------------------

    @Test
    @DisplayName("updateHdocAdcaChange - 存在 → 逻辑删除成功")
    void update_exists_success() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr("ABCD12345");

        HdocAdcaChange existing = new HdocAdcaChange();
        existing.setSerie("ABCD");
        existing.setAct("Y");
        when(hdocAdcaChangeMapper.selectByCondition("ABCD", "12345")).thenReturn(existing);

        UD16ADChangeResponse response = service.updateHdocAdcaChange(req);
        assertEquals(200, response.getCode());
        assertEquals("删除成功", response.getMsg());

        verify(hdocAdcaChangeMapper).updateActToN("ABCD", "12345");
    }

    // =========================================================================
    // deleteHdocAdcaChange (物理删除)
    // =========================================================================

    // -------------------------------------------------------
    // 分支: serieChnr为null/empty/blank → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("deleteHdocAdcaChange - serieChnr为null → 400")
    void delete_serieChnrNull_returns400() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr(null);

        UD16ADChangeResponse response = service.deleteHdocAdcaChange(req);
        assertEquals(400, response.getCode());
        assertEquals("参数不完整", response.getMsg());
        verifyNoInteractions(hdocAdcaChangeMapper);
    }

    @Test
    @DisplayName("deleteHdocAdcaChange - serieChnr为空串 → 400")
    void delete_serieChnrEmpty_returns400() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr("");

        UD16ADChangeResponse response = service.deleteHdocAdcaChange(req);
        assertEquals(400, response.getCode());
        assertEquals("参数不完整", response.getMsg());
        verifyNoInteractions(hdocAdcaChangeMapper);
    }

    @Test
    @DisplayName("deleteHdocAdcaChange - serieChnr为空格 → 400")
    void delete_serieChnrBlank_returns400() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr("   ");

        UD16ADChangeResponse response = service.deleteHdocAdcaChange(req);
        assertEquals(400, response.getCode());
        assertEquals("参数不完整", response.getMsg());
        verifyNoInteractions(hdocAdcaChangeMapper);
    }

    // -------------------------------------------------------
    // 分支: existing == null → 404
    // -------------------------------------------------------

    @Test
    @DisplayName("deleteHdocAdcaChange - 记录不存在 → 404")
    void delete_notExists_returns404() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr("ABCD12345");

        when(hdocAdcaChangeMapper.selectByCondition("ABCD", "12345")).thenReturn(null);

        UD16ADChangeResponse response = service.deleteHdocAdcaChange(req);
        assertEquals(404, response.getCode());
        assertEquals("记录不存在", response.getMsg());
        verify(hdocAdcaChangeMapper, never()).deleteByCondition(anyString(), anyString());
    }

    // -------------------------------------------------------
    // 分支: existing != null → 物理删除成功
    // -------------------------------------------------------

    @Test
    @DisplayName("deleteHdocAdcaChange - 存在 → 物理删除成功")
    void delete_exists_success() {
        UD16ADChangeRequest req = new UD16ADChangeRequest();
        req.setSerieChnr("ABCD12345");

        HdocAdcaChange existing = new HdocAdcaChange();
        existing.setSerie("ABCD");
        when(hdocAdcaChangeMapper.selectByCondition("ABCD", "12345")).thenReturn(existing);

        UD16ADChangeResponse response = service.deleteHdocAdcaChange(req);
        assertEquals(200, response.getCode());
        assertEquals("删除成功", response.getMsg());

        verify(hdocAdcaChangeMapper).deleteByCondition("ABCD", "12345");
    }
}
