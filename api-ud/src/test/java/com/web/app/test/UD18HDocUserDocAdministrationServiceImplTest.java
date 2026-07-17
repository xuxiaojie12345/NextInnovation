package com.web.app.test;

import com.web.app.dto.UD18HDocUserDocAdministrationRequest;
import com.web.app.dto.UD18HDocUserDocAdministrationResponse;
import com.web.app.mapper.UD18HDocUserDocAdministrationMapper;
import com.web.app.service.impl.UD18HDocUserDocAdministrationServiceImpl;
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
 * UD18HDocUserDocAdministrationServiceImpl 单元测试
 * 覆盖 4 个业务方法的所有分支，达到 100% JaCoCo 覆盖率
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD18HDocUserDocAdministrationServiceImpl 单元测试")
class UD18HDocUserDocAdministrationServiceImplTest {

    @Mock
    private UD18HDocUserDocAdministrationMapper ud18Mapper;

    @InjectMocks
    private UD18HDocUserDocAdministrationServiceImpl service;

    private static final String USER_ID = "testuser";
    private static final String DOCTYPE = "Homologation Certificate";

    // ====================================================================
    // UD18SelectHdocFunctionAuth 测试
    // ====================================================================

    @Test
    @DisplayName("[FunctionAuth] userId 为 null 时应返回400")
    void testFunctionAuth_UserIdNull() {
        UD18HDocUserDocAdministrationResponse response = service.UD18SelectHdocFunctionAuth(
                new UD18HDocUserDocAdministrationRequest());
        assertEquals(400, response.getCode().intValue());
        assertEquals("用户ID不能为空", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[FunctionAuth] userId 为空字符串时应返回400")
    void testFunctionAuth_UserIdEmpty() {
        UD18HDocUserDocAdministrationRequest request = new UD18HDocUserDocAdministrationRequest();
        request.setUserId("");
        UD18HDocUserDocAdministrationResponse response = service.UD18SelectHdocFunctionAuth(request);
        assertEquals(400, response.getCode().intValue());
        assertEquals("用户ID不能为空", response.getMsg());
    }

    @Test
    @DisplayName("[FunctionAuth] count > 0 时应返回 exists=true")
    void testFunctionAuth_Exists() {
        when(ud18Mapper.countFunctionAuthByUserId(USER_ID)).thenReturn(3);

        UD18HDocUserDocAdministrationResponse response = service
                .UD18SelectHdocFunctionAuth(createRequest(USER_ID, null));

        assertEquals(200, response.getCode().intValue());
        assertEquals("success", response.getMsg());
        assertNotNull(response.getData());
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertTrue((Boolean) data.get("exists"));
        verify(ud18Mapper, times(1)).countFunctionAuthByUserId(USER_ID);
    }

    @Test
    @DisplayName("[FunctionAuth] count 为 null 时应返回 exists=false")
    void testFunctionAuth_CountNull() {
        when(ud18Mapper.countFunctionAuthByUserId(USER_ID)).thenReturn(null);

        UD18HDocUserDocAdministrationResponse response = service
                .UD18SelectHdocFunctionAuth(createRequest(USER_ID, null));

        assertEquals(200, response.getCode().intValue());
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertFalse((Boolean) data.get("exists"));
        verify(ud18Mapper, times(1)).countFunctionAuthByUserId(USER_ID);
    }

    @Test
    @DisplayName("[FunctionAuth] count 为 0 时应返回 exists=false")
    void testFunctionAuth_CountZero() {
        when(ud18Mapper.countFunctionAuthByUserId(USER_ID)).thenReturn(0);

        UD18HDocUserDocAdministrationResponse response = service
                .UD18SelectHdocFunctionAuth(createRequest(USER_ID, null));

        assertEquals(200, response.getCode().intValue());
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertFalse((Boolean) data.get("exists"));
        verify(ud18Mapper, times(1)).countFunctionAuthByUserId(USER_ID);
    }

    @Test
    @DisplayName("[FunctionAuth] 系统异常时应返回500")
    void testFunctionAuth_Exception() {
        when(ud18Mapper.countFunctionAuthByUserId(anyString()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD18HDocUserDocAdministrationResponse response = service
                .UD18SelectHdocFunctionAuth(createRequest(USER_ID, null));

        assertEquals(500, response.getCode().intValue());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
        verify(ud18Mapper, times(1)).countFunctionAuthByUserId(USER_ID);
    }

    // ====================================================================
    // UD18SelectHdocUserDoc 测试
    // ====================================================================

    @Test
    @DisplayName("[UserDoc] userId 为 null 时应返回400")
    void testUserDoc_UserIdNull() {
        UD18HDocUserDocAdministrationResponse response = service.UD18SelectHdocUserDoc(
                new UD18HDocUserDocAdministrationRequest());
        assertEquals(400, response.getCode().intValue());
        assertEquals("用户ID不能为空", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[UserDoc] doctype 不为 null 时应执行 trim")
    void testUserDoc_DoctypeWithSpaces() {
        when(ud18Mapper.selectUserDocByUserId(USER_ID, "ABC")).thenReturn(new ArrayList<>());

        UD18HDocUserDocAdministrationRequest request = createRequest(USER_ID, "  ABC  ");
        UD18HDocUserDocAdministrationResponse response = service.UD18SelectHdocUserDoc(request);

        assertEquals(200, response.getCode().intValue());
        // 验证 trim 后的值传入 mapper
        verify(ud18Mapper, times(1)).selectUserDocByUserId(USER_ID, "ABC");
    }

    @Test
    @DisplayName("[UserDoc] doctype 为 null 时应传入 null 到 mapper")
    void testUserDoc_DoctypeNull() {
        when(ud18Mapper.selectUserDocByUserId(USER_ID, null)).thenReturn(new ArrayList<>());

        UD18HDocUserDocAdministrationResponse response = service.UD18SelectHdocUserDoc(createRequest(USER_ID, null));

        assertEquals(200, response.getCode().intValue());
        verify(ud18Mapper, times(1)).selectUserDocByUserId(USER_ID, null);
    }

    @Test
    @DisplayName("[UserDoc] docList 为 null 时应返回空列表")
    void testUserDoc_DocListNull() {
        when(ud18Mapper.selectUserDocByUserId(USER_ID, null)).thenReturn(null);

        UD18HDocUserDocAdministrationResponse response = service.UD18SelectHdocUserDoc(createRequest(USER_ID, null));

        assertEquals(200, response.getCode().intValue());
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        @SuppressWarnings("unchecked")
        List<String> doctypes = (List<String>) data.get("doctypes");
        assertTrue(doctypes.isEmpty());
        verify(ud18Mapper, times(1)).selectUserDocByUserId(USER_ID, null);
    }

    @Test
    @DisplayName("[UserDoc] docList 中包含 doctype 为 null 的项时应跳过")
    void testUserDoc_DtNullInList() {
        Map<String, Object> doc1 = new HashMap<>();
        doc1.put("doctype", "TypeA");
        Map<String, Object> doc2 = new HashMap<>();
        doc2.put("doctype", null);
        Map<String, Object> doc3 = new HashMap<>();
        doc3.put("doctype", "TypeB");
        when(ud18Mapper.selectUserDocByUserId(USER_ID, null)).thenReturn(Arrays.asList(doc1, doc2, doc3));

        UD18HDocUserDocAdministrationResponse response = service.UD18SelectHdocUserDoc(createRequest(USER_ID, null));

        assertEquals(200, response.getCode().intValue());
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        @SuppressWarnings("unchecked")
        List<String> doctypes = (List<String>) data.get("doctypes");
        assertEquals(2, doctypes.size());
        assertEquals("TypeA", doctypes.get(0));
        assertEquals("TypeB", doctypes.get(1));
        verify(ud18Mapper, times(1)).selectUserDocByUserId(USER_ID, null);
    }

    @Test
    @DisplayName("[UserDoc] 查询成功时应返回doctype列表")
    void testUserDoc_Success() {
        Map<String, Object> doc1 = new HashMap<>();
        doc1.put("doctype", "Homologation Certificate");
        Map<String, Object> doc2 = new HashMap<>();
        doc2.put("doctype", "DIM-PLATE");
        when(ud18Mapper.selectUserDocByUserId(USER_ID, null)).thenReturn(Arrays.asList(doc1, doc2));

        UD18HDocUserDocAdministrationResponse response = service.UD18SelectHdocUserDoc(createRequest(USER_ID, null));

        assertEquals(200, response.getCode().intValue());
        assertEquals("查询成功", response.getMsg());
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        @SuppressWarnings("unchecked")
        List<String> doctypes = (List<String>) data.get("doctypes");
        assertEquals(2, doctypes.size());
        assertEquals("Homologation Certificate", doctypes.get(0));
        assertEquals("DIM-PLATE", doctypes.get(1));
        verify(ud18Mapper, times(1)).selectUserDocByUserId(USER_ID, null);
    }

    @Test
    @DisplayName("[UserDoc] 系统异常时应返回500")
    void testUserDoc_Exception() {
        when(ud18Mapper.selectUserDocByUserId(anyString(), any()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD18HDocUserDocAdministrationResponse response = service.UD18SelectHdocUserDoc(createRequest(USER_ID, null));

        assertEquals(500, response.getCode().intValue());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
        verify(ud18Mapper, times(1)).selectUserDocByUserId(USER_ID, null);
    }

    // ====================================================================
    // UD18CreateHdocUserDoc 测试
    // ====================================================================

    @Test
    @DisplayName("[Create] userId 为空时应返回400")
    void testCreate_UserIdEmpty() {
        UD18HDocUserDocAdministrationRequest request = new UD18HDocUserDocAdministrationRequest();
        request.setUserId("");
        request.setDoctype(DOCTYPE);
        UD18HDocUserDocAdministrationResponse response = service.UD18CreateHdocUserDoc(request);
        assertEquals(400, response.getCode().intValue());
        assertEquals("用户ID不能为空", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Create] doctype 为 null 时应返回400")
    void testCreate_DoctypeNull() {
        UD18HDocUserDocAdministrationResponse response = service.UD18CreateHdocUserDoc(createRequest(USER_ID, null));
        assertEquals(400, response.getCode().intValue());
        assertEquals("文档类型不能为空", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Create] doctype 为空字符串时应返回400")
    void testCreate_DoctypeEmpty() {
        UD18HDocUserDocAdministrationResponse response = service.UD18CreateHdocUserDoc(createRequest(USER_ID, ""));
        assertEquals(400, response.getCode().intValue());
        assertEquals("文档类型不能为空", response.getMsg());
    }

    @Test
    @DisplayName("[Create] 插入成功时应返回200")
    void testCreate_Success() {
        UD18HDocUserDocAdministrationResponse response = service.UD18CreateHdocUserDoc(createRequest(USER_ID, DOCTYPE));

        assertEquals(200, response.getCode().intValue());
        assertEquals("权限插入成功", response.getMsg());
        assertNull(response.getData());
        verify(ud18Mapper, times(1)).insertUserDoc(
                eq(USER_ID), eq(DOCTYPE), eq(USER_ID), anyString(), eq(USER_ID), anyString());
    }

    @Test
    @DisplayName("[Create] 系统异常时应返回500")
    void testCreate_Exception() {
        doThrow(new RuntimeException("数据库异常"))
                .when(ud18Mapper)
                .insertUserDoc(anyString(), anyString(), anyString(), anyString(), anyString(), anyString());

        UD18HDocUserDocAdministrationResponse response = service.UD18CreateHdocUserDoc(createRequest(USER_ID, DOCTYPE));

        assertEquals(500, response.getCode().intValue());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
    }

    // ====================================================================
    // UD18DeleteHdocUserDoc 测试
    // ====================================================================

    @Test
    @DisplayName("[Delete] userId 为 null 时应返回400")
    void testDelete_UserIdNull() {
        UD18HDocUserDocAdministrationResponse response = service.UD18DeleteHdocUserDoc(
                new UD18HDocUserDocAdministrationRequest());
        assertEquals(400, response.getCode().intValue());
        assertEquals("用户ID不能为空", response.getMsg());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("[Delete] doctype 为空字符串时应返回400")
    void testDelete_DoctypeEmpty() {
        UD18HDocUserDocAdministrationResponse response = service.UD18DeleteHdocUserDoc(createRequest(USER_ID, ""));
        assertEquals(400, response.getCode().intValue());
        assertEquals("文档类型不能为空", response.getMsg());
    }

    @Test
    @DisplayName("[Delete] 删除成功时应返回200")
    void testDelete_Success() {
        UD18HDocUserDocAdministrationResponse response = service.UD18DeleteHdocUserDoc(createRequest(USER_ID, DOCTYPE));

        assertEquals(200, response.getCode().intValue());
        assertEquals("权限删除成功", response.getMsg());
        assertNull(response.getData());
        verify(ud18Mapper, times(1)).deleteUserDoc(USER_ID, DOCTYPE);
    }

    @Test
    @DisplayName("[Delete] 系统异常时应返回500")
    void testDelete_Exception() {
        doThrow(new RuntimeException("数据库异常"))
                .when(ud18Mapper).deleteUserDoc(anyString(), anyString());

        UD18HDocUserDocAdministrationResponse response = service.UD18DeleteHdocUserDoc(createRequest(USER_ID, DOCTYPE));

        assertEquals(500, response.getCode().intValue());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
    }

    // ==================== 辅助方法 ====================

    private UD18HDocUserDocAdministrationRequest createRequest(String userId, String doctype) {
        UD18HDocUserDocAdministrationRequest request = new UD18HDocUserDocAdministrationRequest();
        request.setUserId(userId);
        request.setDoctype(doctype);
        return request;
    }
}
