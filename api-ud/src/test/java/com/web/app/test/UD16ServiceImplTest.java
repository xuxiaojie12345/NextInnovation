package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocAdcaChange;
import com.web.app.mapper.UD16Mapper;
import com.web.app.service.impl.UD16ServiceImpl;
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
 * UD16ServiceImpl 单元测试
 * 覆盖所有分支路径，达到100%分支覆盖率
 */
@ExtendWith(MockitoExtension.class)
class UD16ServiceImplTest {

    @Mock
    private UD16Mapper ud16Mapper;

    @InjectMocks
    private UD16ServiceImpl service;

    private HdocAdcaChange createRequest(String serieChnr, String updateUser, String desc) {
        HdocAdcaChange r = new HdocAdcaChange();
        r.setSerieChnr(serieChnr);
        r.setUpdateUser(updateUser);
        r.setDesc(desc);
        return r;
    }

    private HdocAdcaChange createRecord(String serie, String chnr, String act, String bu, String reason) {
        HdocAdcaChange r = new HdocAdcaChange();
        r.setSerie(serie);
        r.setChnr(chnr);
        r.setAct(act);
        r.setBu(bu);
        r.setReason(reason);
        return r;
    }

    // ============================================================
    // 辅助: parseSerieChnr 通过公有方法间接测试
    // ============================================================

    @Test
    @DisplayName("parseSerieChnr - 正常格式，应正确拆分")
    void parseSerieChnr_NormalFormat_ShouldSplit() {
        // 通过addADChange测试parseSerieChnr
        HdocAdcaChange r = createRequest("ABCD-123456", "admin", "desc");
        when(ud16Mapper.countByPrimaryKey("ABCD", "123456")).thenReturn(0);
        when(ud16Mapper.insert(any())).thenReturn(1);

        ApiResponse<?> result = service.addADChange(r);

        assertEquals(200, result.getCode());
        verify(ud16Mapper, times(1)).insert(argThat(e ->
                "ABCD".equals(e.getSerie()) && "123456".equals(e.getChnr())));
    }

    @Test
    @DisplayName("parseSerieChnr - 无连字符，serie为空")
    void parseSerieChnr_NoHyphen_SerieShouldBeEmpty() {
        HdocAdcaChange r = createRequest("123456", "admin", "desc");

        ApiResponse<?> result = service.addADChange(r);

        assertEquals(400, result.getCode());
        assertTrue(result.getMsg().contains("格式不正确"));
        verifyNoInteractions(ud16Mapper);
    }

    @Test
    @DisplayName("parseSerieChnr - serieChnr为null，返回空数组")
    void checkADChange_SerieChnrNull_ShouldReturn400() {
        HdocAdcaChange r = createRequest(null, "admin", null);

        ApiResponse<?> result = service.checkADChange(r);

        assertEquals(400, result.getCode());
        assertEquals("Serie-Chnr不能为空", result.getMsg());
        verifyNoInteractions(ud16Mapper);
    }

    // ============================================================
    // checkADChange() — 参数校验
    // ============================================================

    @Test
    @DisplayName("checkADChange - serieChnr为空字符串，应返回400")
    void checkADChange_SerieChnrEmpty_ShouldReturn400() {
        HdocAdcaChange r = createRequest("", "admin", null);

        ApiResponse<?> result = service.checkADChange(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(ud16Mapper);
    }

    @Test
    @DisplayName("checkADChange - serieChnr为空白，应返回400")
    void checkADChange_SerieChnrBlank_ShouldReturn400() {
        HdocAdcaChange r = createRequest("   ", "admin", null);

        ApiResponse<?> result = service.checkADChange(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(ud16Mapper);
    }

    @Test
    @DisplayName("checkADChange - serie为空（无连字符），应返回400")
    void checkADChange_SerieEmpty_ShouldReturn400() {
        HdocAdcaChange r = createRequest("-123456", "admin", null);

        ApiResponse<?> result = service.checkADChange(r);

        assertEquals(400, result.getCode());
        assertEquals("Serie-Chnr格式不正确，需为 SERIE-CHNR 格式", result.getMsg());
        verifyNoInteractions(ud16Mapper);
    }

    @Test
    @DisplayName("checkADChange - chnr为空（结尾连字符），应返回400")
    void checkADChange_ChnrEmpty_ShouldReturn400() {
        HdocAdcaChange r = createRequest("ABCD-", "admin", null);

        ApiResponse<?> result = service.checkADChange(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(ud16Mapper);
    }

    @Test
    @DisplayName("checkADChange - serie超过5字符，应返回400")
    void checkADChange_SerieTooLong_ShouldReturn400() {
        HdocAdcaChange r = createRequest("ABCDEF-123", "admin", null);

        ApiResponse<?> result = service.checkADChange(r);

        assertEquals(400, result.getCode());
        assertEquals("SERIE长度不能超过5字符", result.getMsg());
        verifyNoInteractions(ud16Mapper);
    }

    @Test
    @DisplayName("checkADChange - chnr超过10字符，应返回400")
    void checkADChange_ChnrTooLong_ShouldReturn400() {
        HdocAdcaChange r = createRequest("ABCD-12345678901", "admin", null);

        ApiResponse<?> result = service.checkADChange(r);

        assertEquals(400, result.getCode());
        assertEquals("CHNR长度不能超过10字符", result.getMsg());
        verifyNoInteractions(ud16Mapper);
    }

    // ============================================================
    // checkADChange() — 业务逻辑
    // ============================================================

    @Test
    @DisplayName("checkADChange - 记录不存在，应返回404")
    void checkADChange_RecordNotFound_ShouldReturn404() {
        HdocAdcaChange r = createRequest("ABCD-123456", "admin", null);
        when(ud16Mapper.selectByPrimaryKey("ABCD", "123456")).thenReturn(null);

        ApiResponse<?> result = service.checkADChange(r);

        assertEquals(404, result.getCode());
        assertEquals("记录不存在", result.getMsg());
    }

    @Test
    @DisplayName("checkADChange - ACT为N，应返回特殊消息")
    void checkADChange_ActIsN_ShouldReturnSpecialMessage() {
        HdocAdcaChange r = createRequest("ABCD-123456", "admin", null);
        when(ud16Mapper.selectByPrimaryKey("ABCD", "123456"))
                .thenReturn(createRecord("ABCD", "123456", "N", "BU1", "reason1"));

        ApiResponse<?> result = service.checkADChange(r);

        assertEquals(200, result.getCode());
        assertEquals("AFTER DEF CHANGE IS NOT ACTIVATED", result.getMsg());
    }

    @Test
    @DisplayName("checkADChange - ACT为Y，应返回正常消息")
    void checkADChange_ActIsY_ShouldReturnNormalMessage() {
        HdocAdcaChange r = createRequest("ABCD-123456", "admin", null);
        when(ud16Mapper.selectByPrimaryKey("ABCD", "123456"))
                .thenReturn(createRecord("ABCD", "123456", "Y", "BU1", "reason1"));

        ApiResponse<?> result = service.checkADChange(r);

        assertEquals(200, result.getCode());
        assertEquals("检查AD Change成功", result.getMsg());
        assertNotNull(result.getData());
        Map<?, ?> data = (Map<?, ?>) result.getData();
        assertEquals("ABCD", data.get("serie"));
        assertEquals("123456", data.get("chnr"));
        assertEquals("Y", data.get("act"));
        assertEquals("BU1", data.get("bu"));
        assertEquals("reason1", data.get("reason"));
    }

    @Test
    @DisplayName("checkADChange - 记录字段为null，应用空串替代")
    void checkADChange_RecordFieldsNull_ShouldUseEmptyString() {
        HdocAdcaChange r = createRequest("ABCD-123456", "admin", null);
        HdocAdcaChange record = createRecord("ABCD", "123456", null, null, null);
        when(ud16Mapper.selectByPrimaryKey("ABCD", "123456")).thenReturn(record);

        ApiResponse<?> result = service.checkADChange(r);

        assertEquals(200, result.getCode());
        Map<?, ?> data = (Map<?, ?>) result.getData();
        assertEquals("", data.get("act"));
        assertEquals("", data.get("bu"));
        assertEquals("", data.get("reason"));
    }

    @Test
    @DisplayName("checkADChange - Mapper异常，应返回500")
    void checkADChange_MapperThrowsException_ShouldReturn500() {
        HdocAdcaChange r = createRequest("ABCD-123456", "admin", null);
        when(ud16Mapper.selectByPrimaryKey("ABCD", "123456"))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.checkADChange(r);

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // addADChange() — 参数校验
    // ============================================================

    @Test
    @DisplayName("addADChange - serieChnr为null，应返回400")
    void addADChange_SerieChnrNull_ShouldReturn400() {
        HdocAdcaChange r = createRequest(null, "admin", "desc");

        ApiResponse<?> result = service.addADChange(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(ud16Mapper);
    }

    @Test
    @DisplayName("addADChange - serieChnr为空字符串，应返回400")
    void addADChange_SerieChnrEmpty_ShouldReturn400() {
        HdocAdcaChange r = createRequest("", "admin", "desc");

        ApiResponse<?> result = service.addADChange(r);

        assertEquals(400, result.getCode());
        assertEquals("Serie-Chnr不能为空", result.getMsg());
        verifyNoInteractions(ud16Mapper);
    }

    @Test
    @DisplayName("addADChange - serieChnr为空白，应返回400")
    void addADChange_SerieChnrBlank_ShouldReturn400() {
        HdocAdcaChange r = createRequest("   ", "admin", "desc");

        ApiResponse<?> result = service.addADChange(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(ud16Mapper);
    }

    @Test
    @DisplayName("addADChange - serie和chnr均为空，应返回400")
    void addADChange_SerieAndChnrEmpty_ShouldReturn400() {
        HdocAdcaChange r = createRequest("-", "admin", "desc");

        ApiResponse<?> result = service.addADChange(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(ud16Mapper);
    }

    @Test
    @DisplayName("addADChange - chnr为空（结尾连字符），应返回400")
    void addADChange_ChnrEmpty_ShouldReturn400() {
        HdocAdcaChange r = createRequest("ABCD-", "admin", "desc");

        ApiResponse<?> result = service.addADChange(r);

        assertEquals(400, result.getCode());
        assertEquals("Serie-Chnr格式不正确，需为 SERIE-CHNR 格式", result.getMsg());
        verifyNoInteractions(ud16Mapper);
    }

    @Test
    @DisplayName("addADChange - desc超过4000字符，应返回400")
    void addADChange_DescTooLong_ShouldReturn400() {
        HdocAdcaChange r = createRequest("ABCD-123456", "admin",
                new String(new char[4001]).replace('\0', 'D'));

        ApiResponse<?> result = service.addADChange(r);

        assertEquals(400, result.getCode());
        assertEquals("Desc长度不能超过4000字符", result.getMsg());
        verifyNoInteractions(ud16Mapper);
    }

    @Test
    @DisplayName("addADChange - desc为null，应通过长度校验")
    void addADChange_DescNull_ShouldPassLengthCheck() {
        HdocAdcaChange r = createRequest("ABCD-123456", "admin", null);
        when(ud16Mapper.countByPrimaryKey("ABCD", "123456")).thenReturn(0);
        when(ud16Mapper.insert(any())).thenReturn(1);

        ApiResponse<?> result = service.addADChange(r);

        assertEquals(200, result.getCode());
        verify(ud16Mapper, times(1)).insert(argThat(e ->
                "".equals(e.getReason()) // desc为null时reason应为""
        ));
    }

    // ============================================================
    // addADChange() — 业务逻辑
    // ============================================================

    @Test
    @DisplayName("addADChange - 记录已存在且ACT为N，应返回400")
    void addADChange_ExistingActN_ShouldReturn400() {
        HdocAdcaChange r = createRequest("ABCD-123456", "admin", "desc");
        when(ud16Mapper.countByPrimaryKey("ABCD", "123456")).thenReturn(1);
        when(ud16Mapper.selectByPrimaryKey("ABCD", "123456"))
                .thenReturn(createRecord("ABCD", "123456", "N", "", ""));

        ApiResponse<?> result = service.addADChange(r);

        assertEquals(400, result.getCode());
        assertEquals("AFTER DEF CHANGE IS NOT ACTIVATED", result.getMsg());
        verify(ud16Mapper, never()).insert(any());
    }

    @Test
    @DisplayName("addADChange - 记录已存在且ACT为Y，应返回400")
    void addADChange_ExistingActY_ShouldReturn400() {
        HdocAdcaChange r = createRequest("ABCD-123456", "admin", "desc");
        when(ud16Mapper.countByPrimaryKey("ABCD", "123456")).thenReturn(1);
        when(ud16Mapper.selectByPrimaryKey("ABCD", "123456"))
                .thenReturn(createRecord("ABCD", "123456", "Y", "", ""));

        ApiResponse<?> result = service.addADChange(r);

        assertEquals(400, result.getCode());
        assertEquals("记录已存在", result.getMsg());
        verify(ud16Mapper, never()).insert(any());
    }

    @Test
    @DisplayName("addADChange - count>0但existing为null，应返回记录已存在")
    void addADChange_CountPositiveButSelectNull_ShouldReturnExists() {
        HdocAdcaChange r = createRequest("ABCD-123456", "admin", "desc");
        when(ud16Mapper.countByPrimaryKey("ABCD", "123456")).thenReturn(1);
        when(ud16Mapper.selectByPrimaryKey("ABCD", "123456")).thenReturn(null);

        ApiResponse<?> result = service.addADChange(r);

        assertEquals(400, result.getCode());
        assertEquals("记录已存在", result.getMsg());
    }

    @Test
    @DisplayName("addADChange - updateUser为null，使用SYSTEM")
    void addADChange_UserNull_ShouldUseSystem() {
        HdocAdcaChange r = createRequest("ABCD-123456", null, "desc");
        when(ud16Mapper.countByPrimaryKey("ABCD", "123456")).thenReturn(0);
        when(ud16Mapper.insert(any())).thenReturn(1);

        ApiResponse<?> result = service.addADChange(r);

        assertEquals(200, result.getCode());
        verify(ud16Mapper, times(1)).insert(argThat(e ->
                "SYSTEM".equals(e.getRegisterUser()) && "SYSTEM".equals(e.getUpdateUser())));
    }

    @Test
    @DisplayName("addADChange - updateUser为空白，使用SYSTEM")
    void addADChange_UserBlank_ShouldUseSystem() {
        HdocAdcaChange r = createRequest("ABCD-123456", "   ", "desc");
        when(ud16Mapper.countByPrimaryKey("ABCD", "123456")).thenReturn(0);
        when(ud16Mapper.insert(any())).thenReturn(1);

        ApiResponse<?> result = service.addADChange(r);

        assertEquals(200, result.getCode());
        verify(ud16Mapper, times(1)).insert(argThat(e ->
                "SYSTEM".equals(e.getRegisterUser())));
    }

    @Test
    @DisplayName("addADChange - 插入成功，应返回成功")
    void addADChange_InsertSuccess_ShouldReturnSuccess() {
        HdocAdcaChange r = createRequest("ABCD-123456", "admin", "test desc");
        when(ud16Mapper.countByPrimaryKey("ABCD", "123456")).thenReturn(0);
        when(ud16Mapper.insert(any())).thenReturn(1);

        ApiResponse<?> result = service.addADChange(r);

        assertEquals(200, result.getCode());
        assertEquals("添加AD Change成功", result.getMsg());
        assertNotNull(result.getData());
        verify(ud16Mapper, times(1)).insert(argThat(e ->
                "ABCD".equals(e.getSerie()) && "123456".equals(e.getChnr()) &&
                "Y".equals(e.getAct()) && "test desc".equals(e.getReason()) &&
                "UD16_ADD".equals(e.getRegisterProcess())));
    }

    @Test
    @DisplayName("addADChange - 插入返回0，应返回500")
    void addADChange_InsertReturnsZero_ShouldReturn500() {
        HdocAdcaChange r = createRequest("ABCD-123456", "admin", "desc");
        when(ud16Mapper.countByPrimaryKey("ABCD", "123456")).thenReturn(0);
        when(ud16Mapper.insert(any())).thenReturn(0);

        ApiResponse<?> result = service.addADChange(r);

        assertEquals(500, result.getCode());
        assertEquals("添加失败，请重试", result.getMsg());
    }

    @Test
    @DisplayName("addADChange - Mapper异常，应返回500")
    void addADChange_MapperThrowsException_ShouldReturn500() {
        HdocAdcaChange r = createRequest("ABCD-123456", "admin", "desc");
        when(ud16Mapper.countByPrimaryKey("ABCD", "123456"))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.addADChange(r);

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // deleteADChange()
    // ============================================================

    @Test
    @DisplayName("deleteADChange - serieChnr为null，应返回400")
    void deleteADChange_SerieChnrNull_ShouldReturn400() {
        HdocAdcaChange r = createRequest(null, "admin", null);

        ApiResponse<?> result = service.deleteADChange(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(ud16Mapper);
    }

    @Test
    @DisplayName("deleteADChange - serieChnr为空字符串，应返回400")
    void deleteADChange_SerieChnrEmpty_ShouldReturn400() {
        HdocAdcaChange r = createRequest("", "admin", null);

        ApiResponse<?> result = service.deleteADChange(r);

        assertEquals(400, result.getCode());
        assertEquals("Serie-Chnr不能为空", result.getMsg());
        verifyNoInteractions(ud16Mapper);
    }

    @Test
    @DisplayName("deleteADChange - serieChnr为空白，应返回400")
    void deleteADChange_SerieChnrBlank_ShouldReturn400() {
        HdocAdcaChange r = createRequest("   ", "admin", null);

        ApiResponse<?> result = service.deleteADChange(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(ud16Mapper);
    }

    @Test
    @DisplayName("deleteADChange - 格式不正确（无连字符），应返回400")
    void deleteADChange_InvalidFormat_ShouldReturn400() {
        HdocAdcaChange r = createRequest("INVALID", "admin", null);

        ApiResponse<?> result = service.deleteADChange(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(ud16Mapper);
    }

    @Test
    @DisplayName("deleteADChange - chnr为空（结尾连字符），应返回400")
    void deleteADChange_ChnrEmpty_ShouldReturn400() {
        HdocAdcaChange r = createRequest("ABCD-", "admin", null);

        ApiResponse<?> result = service.deleteADChange(r);

        assertEquals(400, result.getCode());
        assertEquals("Serie-Chnr格式不正确，需为 SERIE-CHNR 格式", result.getMsg());
        verifyNoInteractions(ud16Mapper);
    }

    @Test
    @DisplayName("deleteADChange - 记录不存在，应返回400")
    void deleteADChange_NotFound_ShouldReturn400() {
        HdocAdcaChange r = createRequest("ABCD-123456", "admin", null);
        when(ud16Mapper.countByPrimaryKey("ABCD", "123456")).thenReturn(0);

        ApiResponse<?> result = service.deleteADChange(r);

        assertEquals(400, result.getCode());
        assertEquals("记录不存在", result.getMsg());
        verify(ud16Mapper, never()).softDelete(any(), any(), any(), any());
    }

    @Test
    @DisplayName("deleteADChange - updateUser为null，使用SYSTEM")
    void deleteADChange_UserNull_ShouldUseSystem() {
        HdocAdcaChange r = createRequest("ABCD-123456", null, null);
        when(ud16Mapper.countByPrimaryKey("ABCD", "123456")).thenReturn(1);
        when(ud16Mapper.softDelete("ABCD", "123456", "SYSTEM", "UD16_DELETE")).thenReturn(1);

        ApiResponse<?> result = service.deleteADChange(r);

        assertEquals(200, result.getCode());
    }

    @Test
    @DisplayName("deleteADChange - updateUser为空白，使用SYSTEM")
    void deleteADChange_UserBlank_ShouldUseSystem() {
        HdocAdcaChange r = createRequest("ABCD-123456", "   ", null);
        when(ud16Mapper.countByPrimaryKey("ABCD", "123456")).thenReturn(1);
        when(ud16Mapper.softDelete("ABCD", "123456", "SYSTEM", "UD16_DELETE")).thenReturn(1);

        ApiResponse<?> result = service.deleteADChange(r);

        assertEquals(200, result.getCode());
    }

    @Test
    @DisplayName("deleteADChange - 删除成功，应返回成功")
    void deleteADChange_Success_ShouldReturnSuccess() {
        HdocAdcaChange r = createRequest("ABCD-123456", "admin", null);
        when(ud16Mapper.countByPrimaryKey("ABCD", "123456")).thenReturn(1);
        when(ud16Mapper.softDelete("ABCD", "123456", "admin", "UD16_DELETE")).thenReturn(1);

        ApiResponse<?> result = service.deleteADChange(r);

        assertEquals(200, result.getCode());
        assertEquals("删除AD Change成功", result.getMsg());
        assertNotNull(result.getData());
    }

    @Test
    @DisplayName("deleteADChange - 删除返回0，应返回500")
    void deleteADChange_DeleteReturnsZero_ShouldReturn500() {
        HdocAdcaChange r = createRequest("ABCD-123456", "admin", null);
        when(ud16Mapper.countByPrimaryKey("ABCD", "123456")).thenReturn(1);
        when(ud16Mapper.softDelete("ABCD", "123456", "admin", "UD16_DELETE")).thenReturn(0);

        ApiResponse<?> result = service.deleteADChange(r);

        assertEquals(500, result.getCode());
        assertEquals("删除失败，请重试", result.getMsg());
    }

    @Test
    @DisplayName("deleteADChange - Mapper异常，应返回500")
    void deleteADChange_MapperThrowsException_ShouldReturn500() {
        HdocAdcaChange r = createRequest("ABCD-123456", "admin", null);
        when(ud16Mapper.countByPrimaryKey("ABCD", "123456"))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.deleteADChange(r);

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }
}
