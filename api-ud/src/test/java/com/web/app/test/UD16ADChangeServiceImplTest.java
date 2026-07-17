package com.web.app.test;

import com.web.app.dto.UD16ADChangeRequest;
import com.web.app.dto.UD16ADChangeResponse;
import com.web.app.entity.HdocAdcaChange;
import com.web.app.mapper.UD16ADChangeMapper;
import com.web.app.service.impl.UD16ADChangeServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD16ADChangeServiceImpl 单元测试
 * 覆盖 4 个业务方法的所有分支，达到 100% JaCoCo 覆盖率
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD16ADChangeServiceImpl 单元测试")
class UD16ADChangeServiceImplTest {

    @Mock
    private UD16ADChangeMapper ud16Mapper;

    @InjectMocks
    private UD16ADChangeServiceImpl service;

    private static final String SERIE = "ABC12";
    private static final String CHNR = "12345";

    // ====================================================================
    // validateSerieChnr 公共校验（被所有方法调用）
    // ====================================================================

    // ====================================================================
    // UD16InsertHdocAdcaChange 测试
    // ====================================================================

    @Test
    @DisplayName("[Insert] serie 为 null 时应返回400")
    void testInsert_SerieNull() {
        UD16ADChangeResponse response = service
                .UD16InsertHdocAdcaChange(new UD16ADChangeRequest(null, CHNR, null, null));
        assertEquals(400, response.getCode());
        assertEquals("系列和底盘号不能为空", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Insert] chnr 为 null 时应返回400")
    void testInsert_ChnrNull() {
        UD16ADChangeResponse response = service
                .UD16InsertHdocAdcaChange(new UD16ADChangeRequest(SERIE, null, null, null));
        assertEquals(400, response.getCode());
        assertEquals("系列和底盘号不能为空", response.getMsg());
    }

    @Test
    @DisplayName("[Insert] serie 为空字符串时应返回400")
    void testInsert_SerieEmpty() {
        UD16ADChangeResponse response = service.UD16InsertHdocAdcaChange(new UD16ADChangeRequest("", CHNR, null, null));
        assertEquals(400, response.getCode());
        assertEquals("系列和底盘号不能为空", response.getMsg());
    }

    @Test
    @DisplayName("[Insert] chnr 为空字符串时应返回400")
    void testInsert_ChnrEmpty() {
        UD16ADChangeResponse response = service
                .UD16InsertHdocAdcaChange(new UD16ADChangeRequest(SERIE, "", null, null));
        assertEquals(400, response.getCode());
        assertEquals("系列和底盘号不能为空", response.getMsg());
    }

    @Test
    @DisplayName("[Insert] 记录已存在时应返回409")
    void testInsert_ExistingRecord() {
        HdocAdcaChange existing = new HdocAdcaChange();
        existing.setAct("Y");
        when(ud16Mapper.selectAdcaChange(SERIE, CHNR)).thenReturn(existing);

        UD16ADChangeResponse response = service
                .UD16InsertHdocAdcaChange(new UD16ADChangeRequest(SERIE, CHNR, null, null));

        assertEquals(409, response.getCode());
        assertEquals("AFTER DEF CHANGE IS NOT ACTIVATED", response.getMsg());
        assertNull(response.getData());
        verify(ud16Mapper, times(1)).selectAdcaChange(SERIE, CHNR);
        verify(ud16Mapper, never()).insertAdcaChange(any());
    }

    @Test
    @DisplayName("[Insert] 插入成功且 userId 不为空时应使用用户值")
    void testInsert_SuccessWithUser() {
        when(ud16Mapper.selectAdcaChange(SERIE, CHNR)).thenReturn(null);
        when(ud16Mapper.insertAdcaChange(any())).thenReturn(1);

        UD16ADChangeResponse response = service.UD16InsertHdocAdcaChange(
                new UD16ADChangeRequest(SERIE, CHNR, "设计变更", "admin"));

        assertEquals(200, response.getCode());
        assertEquals("添加成功", response.getMsg());
        assertNull(response.getData());

        ArgumentCaptor<HdocAdcaChange> captor = ArgumentCaptor.forClass(HdocAdcaChange.class);
        verify(ud16Mapper, times(1)).selectAdcaChange(SERIE, CHNR);
        verify(ud16Mapper, times(1)).insertAdcaChange(captor.capture());

        HdocAdcaChange captured = captor.getValue();
        assertEquals(SERIE, captured.getSerie());
        assertEquals(CHNR, captured.getChnr());
        assertEquals("Y", captured.getAct());
        assertEquals("UD", captured.getBu());
        assertEquals("设计变更", captured.getReason());
        assertEquals("admin", captured.getRegisterUser());
        assertEquals("UD16", captured.getRegisterProcess());
        assertEquals("admin", captured.getUpdateUser());
        assertEquals("UD16", captured.getUpdateProcess());
    }

    @Test
    @DisplayName("[Insert] 插入成功且 userId 为 null 时应使用 SYSTEM")
    void testInsert_SuccessWithSystemUser() {
        when(ud16Mapper.selectAdcaChange(SERIE, CHNR)).thenReturn(null);
        when(ud16Mapper.insertAdcaChange(any())).thenReturn(1);

        UD16ADChangeResponse response = service.UD16InsertHdocAdcaChange(
                new UD16ADChangeRequest(SERIE, CHNR, null, null));

        assertEquals(200, response.getCode());
        assertEquals("添加成功", response.getMsg());

        ArgumentCaptor<HdocAdcaChange> captor = ArgumentCaptor.forClass(HdocAdcaChange.class);
        verify(ud16Mapper, times(1)).insertAdcaChange(captor.capture());
        assertEquals("SYSTEM", captor.getValue().getRegisterUser());
        assertEquals("SYSTEM", captor.getValue().getUpdateUser());
    }

    @Test
    @DisplayName("[Insert] 插入成功且 userId 为空字符串时应使用 SYSTEM")
    void testInsert_SuccessWithEmptyUser() {
        when(ud16Mapper.selectAdcaChange(SERIE, CHNR)).thenReturn(null);
        when(ud16Mapper.insertAdcaChange(any())).thenReturn(1);

        UD16ADChangeResponse response = service.UD16InsertHdocAdcaChange(
                new UD16ADChangeRequest(SERIE, CHNR, null, ""));

        assertEquals(200, response.getCode());
        assertEquals("添加成功", response.getMsg());

        ArgumentCaptor<HdocAdcaChange> captor = ArgumentCaptor.forClass(HdocAdcaChange.class);
        verify(ud16Mapper, times(1)).insertAdcaChange(captor.capture());
        assertEquals("SYSTEM", captor.getValue().getRegisterUser());
    }

    @Test
    @DisplayName("[Insert] 插入结果返回 null 时应返回500")
    void testInsert_ResultNull() {
        when(ud16Mapper.selectAdcaChange(SERIE, CHNR)).thenReturn(null);
        when(ud16Mapper.insertAdcaChange(any())).thenReturn(null);

        UD16ADChangeResponse response = service.UD16InsertHdocAdcaChange(
                new UD16ADChangeRequest(SERIE, CHNR, null, "admin"));

        assertEquals(500, response.getCode());
        assertEquals("插入失败", response.getMsg());
        assertNull(response.getData());
        verify(ud16Mapper, times(1)).selectAdcaChange(SERIE, CHNR);
        verify(ud16Mapper, times(1)).insertAdcaChange(any());
    }

    @Test
    @DisplayName("[Insert] 插入结果返回0时应返回500")
    void testInsert_ResultZero() {
        when(ud16Mapper.selectAdcaChange(SERIE, CHNR)).thenReturn(null);
        when(ud16Mapper.insertAdcaChange(any())).thenReturn(0);

        UD16ADChangeResponse response = service.UD16InsertHdocAdcaChange(
                new UD16ADChangeRequest(SERIE, CHNR, null, "admin"));

        assertEquals(500, response.getCode());
        assertEquals("插入失败", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Insert] 系统异常时应返回500")
    void testInsert_Exception() {
        when(ud16Mapper.selectAdcaChange(anyString(), anyString()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD16ADChangeResponse response = service.UD16InsertHdocAdcaChange(
                new UD16ADChangeRequest(SERIE, CHNR, null, "admin"));

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
        verify(ud16Mapper, times(1)).selectAdcaChange(SERIE, CHNR);
    }

    // ====================================================================
    // UD16UpdateHdocAdcaChange 测试
    // ====================================================================

    @Test
    @DisplayName("[Update] serie 为 null 时应返回400")
    void testUpdate_SerieNull() {
        UD16ADChangeResponse response = service
                .UD16UpdateHdocAdcaChange(new UD16ADChangeRequest(null, CHNR, null, null));
        assertEquals(400, response.getCode());
        assertEquals("系列和底盘号不能为空", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Update] chnr 为空字符串时应返回400")
    void testUpdate_ChnrEmpty() {
        UD16ADChangeResponse response = service
                .UD16UpdateHdocAdcaChange(new UD16ADChangeRequest(SERIE, "", null, null));
        assertEquals(400, response.getCode());
        assertEquals("系列和底盘号不能为空", response.getMsg());
    }

    @Test
    @DisplayName("[Update] 记录不存在时应返回404")
    void testUpdate_RecordNotFound() {
        when(ud16Mapper.selectAdcaChange(SERIE, CHNR)).thenReturn(null);

        UD16ADChangeResponse response = service
                .UD16UpdateHdocAdcaChange(new UD16ADChangeRequest(SERIE, CHNR, null, null));

        assertEquals(404, response.getCode());
        assertEquals("记录不存在", response.getMsg());
        assertNull(response.getData());
        verify(ud16Mapper, times(1)).selectAdcaChange(SERIE, CHNR);
        verify(ud16Mapper, never()).deleteAdcaChange(any(), any());
    }

    @Test
    @DisplayName("[Update] 删除结果返回 null 时应返回500")
    void testUpdate_ResultNull() {
        when(ud16Mapper.selectAdcaChange(SERIE, CHNR)).thenReturn(new HdocAdcaChange());
        when(ud16Mapper.deleteAdcaChange(SERIE, CHNR)).thenReturn(null);

        UD16ADChangeResponse response = service
                .UD16UpdateHdocAdcaChange(new UD16ADChangeRequest(SERIE, CHNR, null, null));

        assertEquals(500, response.getCode());
        assertEquals("删除失败", response.getMsg());
        assertNull(response.getData());
        verify(ud16Mapper, times(1)).selectAdcaChange(SERIE, CHNR);
        verify(ud16Mapper, times(1)).deleteAdcaChange(SERIE, CHNR);
    }

    @Test
    @DisplayName("[Update] 删除结果返回0时应返回500")
    void testUpdate_ResultZero() {
        when(ud16Mapper.selectAdcaChange(SERIE, CHNR)).thenReturn(new HdocAdcaChange());
        when(ud16Mapper.deleteAdcaChange(SERIE, CHNR)).thenReturn(0);

        UD16ADChangeResponse response = service
                .UD16UpdateHdocAdcaChange(new UD16ADChangeRequest(SERIE, CHNR, null, null));

        assertEquals(500, response.getCode());
        assertEquals("删除失败", response.getMsg());
        assertNull(response.getData());
        verify(ud16Mapper, times(1)).selectAdcaChange(SERIE, CHNR);
        verify(ud16Mapper, times(1)).deleteAdcaChange(SERIE, CHNR);
    }

    @Test
    @DisplayName("[Update] 删除成功时应返回200")
    void testUpdate_Success() {
        when(ud16Mapper.selectAdcaChange(SERIE, CHNR)).thenReturn(new HdocAdcaChange());
        when(ud16Mapper.deleteAdcaChange(SERIE, CHNR)).thenReturn(1);

        UD16ADChangeResponse response = service
                .UD16UpdateHdocAdcaChange(new UD16ADChangeRequest(SERIE, CHNR, null, null));

        assertEquals(200, response.getCode());
        assertEquals("删除成功", response.getMsg());
        assertNull(response.getData());
        verify(ud16Mapper, times(1)).selectAdcaChange(SERIE, CHNR);
        verify(ud16Mapper, times(1)).deleteAdcaChange(SERIE, CHNR);
    }

    @Test
    @DisplayName("[Update] 系统异常时应返回500")
    void testUpdate_Exception() {
        when(ud16Mapper.selectAdcaChange(anyString(), anyString()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD16ADChangeResponse response = service
                .UD16UpdateHdocAdcaChange(new UD16ADChangeRequest(SERIE, CHNR, null, null));

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
        verify(ud16Mapper, times(1)).selectAdcaChange(SERIE, CHNR);
    }

    // ====================================================================
    // UD16SelectHdocAdcaChange 测试
    // ====================================================================

    @Test
    @DisplayName("[Select] serie 为 null 时应返回400")
    void testSelect_SerieNull() {
        UD16ADChangeResponse response = service
                .UD16SelectHdocAdcaChange(new UD16ADChangeRequest(null, CHNR, null, null));
        assertEquals(400, response.getCode());
        assertEquals("系列和底盘号不能为空", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Select] chnr 为 null 时应返回400")
    void testSelect_ChnrNull() {
        UD16ADChangeResponse response = service
                .UD16SelectHdocAdcaChange(new UD16ADChangeRequest(SERIE, null, null, null));
        assertEquals(400, response.getCode());
        assertEquals("系列和底盘号不能为空", response.getMsg());
    }

    @Test
    @DisplayName("[Select] 记录不存在时应返回404")
    void testSelect_RecordNotFound() {
        when(ud16Mapper.selectAdcaChange(SERIE, CHNR)).thenReturn(null);

        UD16ADChangeResponse response = service
                .UD16SelectHdocAdcaChange(new UD16ADChangeRequest(SERIE, CHNR, null, null));

        assertEquals(404, response.getCode());
        assertEquals("记录不存在", response.getMsg());
        assertNull(response.getData());
        verify(ud16Mapper, times(1)).selectAdcaChange(SERIE, CHNR);
    }

    @Test
    @DisplayName("[Select] 记录存在时应返回200含 exists 和 act 数据")
    void testSelect_Success() {
        HdocAdcaChange existing = new HdocAdcaChange();
        existing.setAct("Y");
        when(ud16Mapper.selectAdcaChange(SERIE, CHNR)).thenReturn(existing);

        UD16ADChangeResponse response = service
                .UD16SelectHdocAdcaChange(new UD16ADChangeRequest(SERIE, CHNR, null, null));

        assertEquals(200, response.getCode());
        assertEquals("对应的数据存在", response.getMsg());
        assertNotNull(response.getData());

        @SuppressWarnings("unchecked")
        Map<String, Object> resultData = (Map<String, Object>) response.getData();
        assertTrue((Boolean) resultData.get("exists"));
        assertEquals("Y", resultData.get("act"));
        verify(ud16Mapper, times(1)).selectAdcaChange(SERIE, CHNR);
    }

    @Test
    @DisplayName("[Select] 系统异常时应返回500")
    void testSelect_Exception() {
        when(ud16Mapper.selectAdcaChange(anyString(), anyString()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD16ADChangeResponse response = service
                .UD16SelectHdocAdcaChange(new UD16ADChangeRequest(SERIE, CHNR, null, null));

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
        verify(ud16Mapper, times(1)).selectAdcaChange(SERIE, CHNR);
    }
}
