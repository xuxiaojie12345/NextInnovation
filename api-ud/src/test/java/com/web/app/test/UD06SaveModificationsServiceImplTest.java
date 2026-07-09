package com.web.app.test;

import com.web.app.dto.UD06SaveModificationsRequest;
import com.web.app.dto.UD06SaveModificationsResponse;
import com.web.app.entity.HdocAdcaModification;
import com.web.app.mapper.HdocAdcaModificationMapper;
import com.web.app.service.impl.UD06SaveModificationsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD06SaveModificationsServiceImpl 单元测试
 * 覆盖所有分支：null分支、empty分支、空白分支、正常分支
 * 分支覆盖率达到 100%
 */
@ExtendWith(MockitoExtension.class)
class UD06SaveModificationsServiceImplTest {

    @Mock
    private HdocAdcaModificationMapper hdocAdcaModificationMapper;

    @InjectMocks
    private UD06SaveModificationsServiceImpl service;

    private UD06SaveModificationsRequest request;

    @BeforeEach
    void setUp() {
        request = new UD06SaveModificationsRequest();
    }

    // =========================================================================
    // selectHdocAdcaModification 方法
    // =========================================================================

    // -------------------------------------------------------
    // 分支: chassisSerie == null
    // 分支: chassisSerie.trim().isEmpty() (空字符串)
    // 分支: chassisSerie.trim().isEmpty() (纯空格)
    // 预期: code=400, msg="Chassis Serie不能为空", Mapper未被调用
    // -------------------------------------------------------

    @Test
    @DisplayName("selectHdocAdcaModification - chassisSerie为null → 返回400")
    void select_serieNull_returns400() {
        request.setChassisSerie(null);
        request.setChassisNumber("12345");

        UD06SaveModificationsResponse response = service.selectHdocAdcaModification(request);

        assertEquals(400, response.getCode());
        assertEquals("Chassis Serie不能为空", response.getMsg());
        assertNull(response.getData());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("selectHdocAdcaModification - chassisSerie为空字符串 → 返回400")
    void select_serieEmpty_returns400() {
        request.setChassisSerie("");
        request.setChassisNumber("12345");

        UD06SaveModificationsResponse response = service.selectHdocAdcaModification(request);

        assertEquals(400, response.getCode());
        assertEquals("Chassis Serie不能为空", response.getMsg());
        assertNull(response.getData());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("selectHdocAdcaModification - chassisSerie为纯空格 → 返回400")
    void select_serieBlank_returns400() {
        request.setChassisSerie("   ");
        request.setChassisNumber("12345");

        UD06SaveModificationsResponse response = service.selectHdocAdcaModification(request);

        assertEquals(400, response.getCode());
        assertEquals("Chassis Serie不能为空", response.getMsg());
        assertNull(response.getData());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    // -------------------------------------------------------
    // 分支: chassisNumber == null (chassisSerie有效时)
    // 分支: chassisNumber.trim().isEmpty() (空字符串)
    // 分支: chassisNumber.trim().isEmpty() (纯空格)
    // 预期: code=400, msg="Chassis Number不能为空", Mapper未被调用
    // -------------------------------------------------------

    @Test
    @DisplayName("selectHdocAdcaModification - chassisNumber为null → 返回400")
    void select_numberNull_returns400() {
        request.setChassisSerie("ABCD");
        request.setChassisNumber(null);

        UD06SaveModificationsResponse response = service.selectHdocAdcaModification(request);

        assertEquals(400, response.getCode());
        assertEquals("Chassis Number不能为空", response.getMsg());
        assertNull(response.getData());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("selectHdocAdcaModification - chassisNumber为空字符串 → 返回400")
    void select_numberEmpty_returns400() {
        request.setChassisSerie("ABCD");
        request.setChassisNumber("");

        UD06SaveModificationsResponse response = service.selectHdocAdcaModification(request);

        assertEquals(400, response.getCode());
        assertEquals("Chassis Number不能为空", response.getMsg());
        assertNull(response.getData());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("selectHdocAdcaModification - chassisNumber为纯空格 → 返回400")
    void select_numberBlank_returns400() {
        request.setChassisSerie("ABCD");
        request.setChassisNumber("   ");

        UD06SaveModificationsResponse response = service.selectHdocAdcaModification(request);

        assertEquals(400, response.getCode());
        assertEquals("Chassis Number不能为空", response.getMsg());
        assertNull(response.getData());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    // -------------------------------------------------------
    // 分支: list == null (Mapper返回null)
    // 预期: code=200, data中使用固定mock数据
    // -------------------------------------------------------

    @Test
    @DisplayName("selectHdocAdcaModification - Mapper返回null → 使用mock数据返回200")
    void select_listIsNull_usesMockData() {
        request.setChassisSerie("ABCD");
        request.setChassisNumber("12345");

        when(hdocAdcaModificationMapper.selectByCondition("ABCD", "12345")).thenReturn(null);

        UD06SaveModificationsResponse response = service.selectHdocAdcaModification(request);

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals("DIM-PLATE", data.get("doctype"));
        assertEquals("1", data.get("version"));
        assertEquals("SEAT_NO 4", data.get("storing"));
        assertEquals(1, data.get("foundUnreleasedVersion"));
        assertEquals("VERSION IS RELEASED", data.get("message"));

        verify(hdocAdcaModificationMapper).selectByCondition("ABCD", "12345");
    }

    // -------------------------------------------------------
    // 分支: list.isEmpty() == true (Mapper返回空列表)
    // 预期: code=200, data中使用固定mock数据
    // -------------------------------------------------------

    @Test
    @DisplayName("selectHdocAdcaModification - Mapper返回空列表 → 使用mock数据返回200")
    void select_listIsEmpty_usesMockData() {
        request.setChassisSerie("ABCD");
        request.setChassisNumber("12345");

        when(hdocAdcaModificationMapper.selectByCondition("ABCD", "12345"))
                .thenReturn(Collections.emptyList());

        UD06SaveModificationsResponse response = service.selectHdocAdcaModification(request);

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals("DIM-PLATE", data.get("doctype"));
        assertEquals("1", data.get("version"));
        assertEquals("SEAT_NO 4", data.get("storing"));
        assertEquals(1, data.get("foundUnreleasedVersion"));
        assertEquals("VERSION IS RELEASED", data.get("message"));

        verify(hdocAdcaModificationMapper).selectByCondition("ABCD", "12345");
    }

    // -------------------------------------------------------
    // 分支: list有数据 → 使用list.get(0)填充storing字段
    // 预期: code=200, storing = variable + " " + newval
    // -------------------------------------------------------

    @Test
    @DisplayName("selectHdocAdcaModification - Mapper返回数据 → 使用实体数据返回200")
    void select_listHasData_usesEntityData() {
        request.setChassisSerie("ABCD");
        request.setChassisNumber("12345");

        HdocAdcaModification mod = new HdocAdcaModification();
        mod.setSerie("ABCD");
        mod.setChno("12345");
        mod.setVariable("VIN");
        mod.setDescription("Vehicle Identification Number");
        mod.setNewval("JPCYZ50A2LT028321");

        when(hdocAdcaModificationMapper.selectByCondition("ABCD", "12345"))
                .thenReturn(Collections.singletonList(mod));

        UD06SaveModificationsResponse response = service.selectHdocAdcaModification(request);

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals("DIM-PLATE", data.get("doctype"));
        assertEquals("1", data.get("version"));
        // storing = variable + " " + newval = "VIN" + " " + "JPCYZ50A2LT028321"
        assertEquals("VIN JPCYZ50A2LT028321", data.get("storing"));
        assertEquals(1, data.get("foundUnreleasedVersion"));
        assertEquals("VERSION IS RELEASED", data.get("message"));

        verify(hdocAdcaModificationMapper).selectByCondition("ABCD", "12345");
    }

    // -------------------------------------------------------
    // 分支: list有数据，验证variable和newval值不同的情况
    // 预期: code=200, storing正确拼接
    // -------------------------------------------------------

    @Test
    @DisplayName("selectHdocAdcaModification - Mapper返回多行数据 → 仅取第一条的storing")
    void select_listHasMultipleRows_usesFirstRow() {
        request.setChassisSerie("ABCD");
        request.setChassisNumber("12345");

        HdocAdcaModification mod1 = new HdocAdcaModification();
        mod1.setVariable("ENGINE_TYPE");
        mod1.setNewval("D13K");

        HdocAdcaModification mod2 = new HdocAdcaModification();
        mod2.setVariable("VIN");
        mod2.setNewval("JPCYZ50A2LT028321");

        when(hdocAdcaModificationMapper.selectByCondition("ABCD", "12345"))
                .thenReturn(Arrays.asList(mod1, mod2));

        UD06SaveModificationsResponse response = service.selectHdocAdcaModification(request);

        assertEquals(200, response.getCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        // 只取第一条: ENGINE_TYPE D13K
        assertEquals("ENGINE_TYPE D13K", data.get("storing"));

        verify(hdocAdcaModificationMapper).selectByCondition("ABCD", "12345");
    }
}
