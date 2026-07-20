package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocDocumentList;
import com.web.app.domain.Entity.UserInfo;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.impl.UD18ServiceImpl;
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
 * UD18ServiceImpl 单元测试
 * 覆盖所有分支路径，达到100%分支覆盖率
 */
@ExtendWith(MockitoExtension.class)
class UD18ServiceImplTest {

    @Mock
    private HdocDocumentListMapper hdocDocumentListMapper;

    @InjectMocks
    private UD18ServiceImpl service;

    private HdocDocumentList createRequest(String userId, String updateUser, List<String> documentTypes) {
        HdocDocumentList r = new HdocDocumentList();
        r.setUserId(userId);
        r.setUpdateUser(updateUser);
        r.setDocumentTypes(documentTypes);
        return r;
    }

    private UserInfo createUserInfo() {
        UserInfo u = new UserInfo();
        u.setUserId("testuser");
        u.setUsername("Test User");
        return u;
    }

    // ============================================================
    // getDocumentList()
    // ============================================================

    @Test
    @DisplayName("getDocumentList - 正常返回")
    void getDocumentList_Success_ShouldReturnList() {
        Map<String, String> doc = new HashMap<>();
        doc.put("DESCRIPTION", "HDOC");
        when(hdocDocumentListMapper.selectDocumentList()).thenReturn(Arrays.asList(doc));

        ApiResponse<?> result = service.getDocumentList();

        assertEquals(200, result.getCode());
        assertEquals("获取文档列表成功", result.getMsg());
        assertNotNull(result.getData());
    }

    @Test
    @DisplayName("getDocumentList - Mapper返回null，应返回404")
    void getDocumentList_Null_ShouldReturn404() {
        when(hdocDocumentListMapper.selectDocumentList()).thenReturn(null);

        ApiResponse<?> result = service.getDocumentList();

        assertEquals(404, result.getCode());
        assertEquals("文档列表为空", result.getMsg());
    }

    @Test
    @DisplayName("getDocumentList - Mapper返回空列表，应返回404")
    void getDocumentList_Empty_ShouldReturn404() {
        when(hdocDocumentListMapper.selectDocumentList()).thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.getDocumentList();

        assertEquals(404, result.getCode());
    }

    @Test
    @DisplayName("getDocumentList - Mapper异常，应返回500")
    void getDocumentList_Exception_ShouldReturn500() {
        when(hdocDocumentListMapper.selectDocumentList()).thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.getDocumentList();

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // getUserFunctionsAndDocuments() — 参数校验
    // ============================================================

    @Test
    @DisplayName("getUserFunctionsAndDocuments - userId为空，应返回400")
    void getUserFunctionsAndDocuments_UserIdEmpty_ShouldReturn400() {
        HdocDocumentList r = createRequest("", null, null);

        ApiResponse<?> result = service.getUserFunctionsAndDocuments(r);

        assertEquals(400, result.getCode());
        assertEquals("UserId不能为空", result.getMsg());
        verifyNoInteractions(hdocDocumentListMapper);
    }

    @Test
    @DisplayName("getUserFunctionsAndDocuments - userId为null，应返回400")
    void getUserFunctionsAndDocuments_UserIdNull_ShouldReturn400() {
        HdocDocumentList r = createRequest(null, null, null);

        ApiResponse<?> result = service.getUserFunctionsAndDocuments(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(hdocDocumentListMapper);
    }

    @Test
    @DisplayName("getUserFunctionsAndDocuments - userId超过20字符，应返回400")
    void getUserFunctionsAndDocuments_UserIdTooLong_ShouldReturn400() {
        HdocDocumentList r = createRequest(new String(new char[21]).replace('\0', 'U'), null, null);

        ApiResponse<?> result = service.getUserFunctionsAndDocuments(r);

        assertEquals(400, result.getCode());
        assertEquals("UserId长度不能超过20字符", result.getMsg());
        verifyNoInteractions(hdocDocumentListMapper);
    }

    // ============================================================
    // getUserFunctionsAndDocuments() — 业务逻辑
    // ============================================================

    @Test
    @DisplayName("getUserFunctionsAndDocuments - 用户不存在，应返回404")
    void getUserFunctionsAndDocuments_UserNotFound_ShouldReturn404() {
        HdocDocumentList r = createRequest("testuser", null, null);
        when(hdocDocumentListMapper.countUserById("testuser")).thenReturn(0);

        ApiResponse<?> result = service.getUserFunctionsAndDocuments(r);

        assertEquals(404, result.getCode());
        verify(hdocDocumentListMapper, never()).selectFunctionAuth(any());
        verify(hdocDocumentListMapper, never()).selectUserDocAuth(any());
        verify(hdocDocumentListMapper, never()).selectUserInfo(any(), any());
    }

    @Test
    @DisplayName("getUserFunctionsAndDocuments - 正常返回，functions/documents为null→空列表，userInfo为null→空用户名")
    void getUserFunctionsAndDocuments_AllNull_ShouldUseDefaults() {
        HdocDocumentList r = createRequest("testuser", null, null);
        when(hdocDocumentListMapper.countUserById("testuser")).thenReturn(1);
        when(hdocDocumentListMapper.selectFunctionAuth("testuser")).thenReturn(null);
        when(hdocDocumentListMapper.selectUserDocAuth("testuser")).thenReturn(null);
        when(hdocDocumentListMapper.selectUserInfo("testuser", null)).thenReturn(null);

        ApiResponse<?> result = service.getUserFunctionsAndDocuments(r);

        assertEquals(200, result.getCode());
        assertEquals("获取用户功能和文档权限成功", result.getMsg());
        assertNotNull(result.getData());
        Map<?, ?> data = (Map<?, ?>) result.getData();
        assertEquals("", data.get("username"));
        assertTrue(((List<?>) data.get("functions")).isEmpty());
        assertTrue(((List<?>) data.get("documents")).isEmpty());
    }

    @Test
    @DisplayName("getUserFunctionsAndDocuments - 正常返回，包含所有数据")
    void getUserFunctionsAndDocuments_Success_ShouldReturnData() {
        HdocDocumentList r = createRequest("testuser", null, null);
        when(hdocDocumentListMapper.countUserById("testuser")).thenReturn(1);
        when(hdocDocumentListMapper.selectFunctionAuth("testuser")).thenReturn(new ArrayList<>());
        when(hdocDocumentListMapper.selectUserDocAuth("testuser")).thenReturn(new ArrayList<>());
        when(hdocDocumentListMapper.selectUserInfo("testuser", null)).thenReturn(createUserInfo());

        ApiResponse<?> result = service.getUserFunctionsAndDocuments(r);

        assertEquals(200, result.getCode());
        Map<?, ?> data = (Map<?, ?>) result.getData();
        assertEquals("Test User", data.get("username"));
    }

    @Test
    @DisplayName("getUserFunctionsAndDocuments - Mapper异常，应返回500")
    void getUserFunctionsAndDocuments_Exception_ShouldReturn500() {
        HdocDocumentList r = createRequest("testuser", null, null);
        when(hdocDocumentListMapper.countUserById("testuser"))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.getUserFunctionsAndDocuments(r);

        assertEquals(500, result.getCode());
    }

    // ============================================================
    // updateUserDocuments() — 参数校验
    // ============================================================

    @Test
    @DisplayName("updateUserDocuments - userId为空，应返回400")
    void updateUserDocuments_UserIdEmpty_ShouldReturn400() {
        HdocDocumentList r = createRequest("", null, Arrays.asList("HDOC"));

        ApiResponse<?> result = service.updateUserDocuments(r);

        assertEquals(400, result.getCode());
        assertEquals("UserId不能为空", result.getMsg());
        verifyNoInteractions(hdocDocumentListMapper);
    }

    @Test
    @DisplayName("updateUserDocuments - userId为null，应返回400")
    void updateUserDocuments_UserIdNull_ShouldReturn400() {
        HdocDocumentList r = createRequest(null, null, Arrays.asList("HDOC"));

        ApiResponse<?> result = service.updateUserDocuments(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(hdocDocumentListMapper);
    }

    @Test
    @DisplayName("updateUserDocuments - userId超过20字符，应返回400")
    void updateUserDocuments_UserIdTooLong_ShouldReturn400() {
        HdocDocumentList r = createRequest(new String(new char[21]).replace('\0', 'U'), null, Arrays.asList("HDOC"));

        ApiResponse<?> result = service.updateUserDocuments(r);

        assertEquals(400, result.getCode());
        assertEquals("UserId长度不能超过20字符", result.getMsg());
        verifyNoInteractions(hdocDocumentListMapper);
    }

    @Test
    @DisplayName("updateUserDocuments - documentTypes为null，应视为空列表")
    void updateUserDocuments_DocumentTypesNull_ShouldTreatAsEmpty() {
        HdocDocumentList r = createRequest("testuser", "admin", null);
        when(hdocDocumentListMapper.countUserById("testuser")).thenReturn(1);
        when(hdocDocumentListMapper.deleteAllUserDocAuth("testuser")).thenReturn(0);

        ApiResponse<?> result = service.updateUserDocuments(r);

        assertEquals(200, result.getCode());
        verify(hdocDocumentListMapper, times(1)).deleteAllUserDocAuth("testuser");
        verify(hdocDocumentListMapper, never()).insertUserDocAuth(any(), any(), any(), any(), any(), any());
    }

    // ============================================================
    // updateUserDocuments() — 业务逻辑
    // ============================================================

    @Test
    @DisplayName("updateUserDocuments - 用户不存在，应返回404")
    void updateUserDocuments_UserNotFound_ShouldReturn404() {
        HdocDocumentList r = createRequest("testuser", "admin", Arrays.asList("HDOC"));
        when(hdocDocumentListMapper.countUserById("testuser")).thenReturn(0);

        ApiResponse<?> result = service.updateUserDocuments(r);

        assertEquals(404, result.getCode());
        verify(hdocDocumentListMapper, never()).deleteAllUserDocAuth(any());
        verify(hdocDocumentListMapper, never()).insertUserDocAuth(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("updateUserDocuments - updateUser为null，使用SYSTEM")
    void updateUserDocuments_UpdateUserNull_ShouldUseSystem() {
        HdocDocumentList r = createRequest("testuser", null, Arrays.asList("HDOC", "TEMPLATE"));
        when(hdocDocumentListMapper.countUserById("testuser")).thenReturn(1);
        when(hdocDocumentListMapper.deleteAllUserDocAuth("testuser")).thenReturn(0);

        ApiResponse<?> result = service.updateUserDocuments(r);

        assertEquals(200, result.getCode());
        verify(hdocDocumentListMapper, times(1))
                .insertUserDocAuth("testuser", "HDOC", "SYSTEM", "UD18_UPDATE_USER_DOC", "SYSTEM", "UD18_UPDATE_USER_DOC");
        verify(hdocDocumentListMapper, times(1))
                .insertUserDocAuth("testuser", "TEMPLATE", "SYSTEM", "UD18_UPDATE_USER_DOC", "SYSTEM", "UD18_UPDATE_USER_DOC");
    }

    @Test
    @DisplayName("updateUserDocuments - updateUser为空白，使用SYSTEM")
    void updateUserDocuments_UpdateUserBlank_ShouldUseSystem() {
        HdocDocumentList r = createRequest("testuser", "   ", Arrays.asList("HDOC"));
        when(hdocDocumentListMapper.countUserById("testuser")).thenReturn(1);
        when(hdocDocumentListMapper.deleteAllUserDocAuth("testuser")).thenReturn(0);

        ApiResponse<?> result = service.updateUserDocuments(r);

        assertEquals(200, result.getCode());
        verify(hdocDocumentListMapper, times(1))
                .insertUserDocAuth("testuser", "HDOC", "SYSTEM", "UD18_UPDATE_USER_DOC", "SYSTEM", "UD18_UPDATE_USER_DOC");
    }

    @Test
    @DisplayName("updateUserDocuments - 文档类型含null或空白，应跳过")
    void updateUserDocuments_SkipInvalidDocTypes_ShouldInsertOnlyValid() {
        HdocDocumentList r = createRequest("testuser", "admin", Arrays.asList("HDOC", null, "", "TEMPLATE", "   "));
        when(hdocDocumentListMapper.countUserById("testuser")).thenReturn(1);
        when(hdocDocumentListMapper.deleteAllUserDocAuth("testuser")).thenReturn(0);

        ApiResponse<?> result = service.updateUserDocuments(r);

        assertEquals(200, result.getCode());
        // 只应插入 "HDOC" 和 "TEMPLATE"
        verify(hdocDocumentListMapper, times(1))
                .insertUserDocAuth("testuser", "HDOC", "admin", "UD18_UPDATE_USER_DOC", "admin", "UD18_UPDATE_USER_DOC");
        verify(hdocDocumentListMapper, times(1))
                .insertUserDocAuth("testuser", "TEMPLATE", "admin", "UD18_UPDATE_USER_DOC", "admin", "UD18_UPDATE_USER_DOC");
        verify(hdocDocumentListMapper, times(2)).insertUserDocAuth(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("updateUserDocuments - 更新成功，应返回成功")
    void updateUserDocuments_Success_ShouldReturnSuccess() {
        HdocDocumentList r = createRequest("testuser", "admin", Arrays.asList("HDOC"));
        when(hdocDocumentListMapper.countUserById("testuser")).thenReturn(1);
        when(hdocDocumentListMapper.deleteAllUserDocAuth("testuser")).thenReturn(3);

        ApiResponse<?> result = service.updateUserDocuments(r);

        assertEquals(200, result.getCode());
        assertEquals("更新用户文档权限成功", result.getMsg());
        assertNotNull(result.getData());
        Map<?, ?> data = (Map<?, ?>) result.getData();
        assertEquals("testuser", data.get("userid"));
        assertEquals(3, data.get("deletedCount"));
        assertEquals(Arrays.asList("HDOC"), data.get("documentTypes"));
    }

    @Test
    @DisplayName("updateUserDocuments - Mapper异常，应返回500")
    void updateUserDocuments_Exception_ShouldReturn500() {
        HdocDocumentList r = createRequest("testuser", "admin", Arrays.asList("HDOC"));
        when(hdocDocumentListMapper.countUserById("testuser"))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.updateUserDocuments(r);

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }
}
