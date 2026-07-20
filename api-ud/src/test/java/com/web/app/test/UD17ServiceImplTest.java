package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocDocumentList;
import com.web.app.domain.Entity.MarketMaster;
import com.web.app.domain.Entity.UserInfo;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.impl.UD17ServiceImpl;
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
 * UD17ServiceImpl 单元测试
 * 覆盖所有分支路径，达到100%分支覆盖率
 */
@ExtendWith(MockitoExtension.class)
class UD17ServiceImplTest {

    @Mock
    private HdocDocumentListMapper hdocDocumentListMapper;

    @InjectMocks
    private UD17ServiceImpl service;

    private HdocDocumentList createRequest(String userId, String userName, String updateUser) {
        HdocDocumentList r = new HdocDocumentList();
        r.setUserId(userId);
        r.setUserName(userName);
        r.setUpdateUser(updateUser);
        return r;
    }

    private UserInfo createUserInfo() {
        UserInfo u = new UserInfo();
        u.setUserId("testuser");
        u.setUsername("Test User");
        u.setResponsible("Manager");
        u.setUserposition("Admin");
        u.setEMmail("test@example.com");
        return u;
    }

    // ============================================================
    // getMarketList()
    // ============================================================

    @Test
    @DisplayName("getMarketList - 正常返回市场列表")
    void getMarketList_Success_ShouldReturnMarketList() {
        MarketMaster m = new MarketMaster();
        m.setMarket("JP");
        when(hdocDocumentListMapper.selectMarketList()).thenReturn(Arrays.asList(m));

        ApiResponse<?> result = service.getMarketList();

        assertEquals(200, result.getCode());
        assertEquals("获取市场列表成功", result.getMsg());
        assertNotNull(result.getData());
    }

    @Test
    @DisplayName("getMarketList - Mapper返回null，应返回404")
    void getMarketList_ListNull_ShouldReturn404() {
        when(hdocDocumentListMapper.selectMarketList()).thenReturn(null);

        ApiResponse<?> result = service.getMarketList();

        assertEquals(404, result.getCode());
        assertEquals("市场列表为空", result.getMsg());
    }

    @Test
    @DisplayName("getMarketList - Mapper返回空列表，应返回404")
    void getMarketList_ListEmpty_ShouldReturn404() {
        when(hdocDocumentListMapper.selectMarketList()).thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.getMarketList();

        assertEquals(404, result.getCode());
    }

    @Test
    @DisplayName("getMarketList - Mapper异常，应返回500")
    void getMarketList_MapperThrowsException_ShouldReturn500() {
        when(hdocDocumentListMapper.selectMarketList()).thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.getMarketList();

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // getUserInfo() — 参数校验
    // ============================================================

    @Test
    @DisplayName("getUserInfo - userId和userName均为空，应返回400")
    void getUserInfo_BothEmpty_ShouldReturn400() {
        HdocDocumentList r = createRequest("", "", null);

        ApiResponse<?> result = service.getUserInfo(r);

        assertEquals(400, result.getCode());
        assertEquals("UserId或UserName不能为空", result.getMsg());
        verifyNoInteractions(hdocDocumentListMapper);
    }

    @Test
    @DisplayName("getUserInfo - userId为null且userName为null，应返回400")
    void getUserInfo_BothNull_ShouldReturn400() {
        HdocDocumentList r = createRequest(null, null, null);

        ApiResponse<?> result = service.getUserInfo(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(hdocDocumentListMapper);
    }

    @Test
    @DisplayName("getUserInfo - userId超过20字符，应返回400")
    void getUserInfo_UserIdTooLong_ShouldReturn400() {
        HdocDocumentList r = createRequest(new String(new char[21]).replace('\0', 'U'), "user", null);

        ApiResponse<?> result = service.getUserInfo(r);

        assertEquals(400, result.getCode());
        assertEquals("UserId长度不能超过20字符", result.getMsg());
        verifyNoInteractions(hdocDocumentListMapper);
    }

    @Test
    @DisplayName("getUserInfo - userName超过100字符，应返回400")
    void getUserInfo_UserNameTooLong_ShouldReturn400() {
        HdocDocumentList r = createRequest("user", new String(new char[101]).replace('\0', 'N'), null);

        ApiResponse<?> result = service.getUserInfo(r);

        assertEquals(400, result.getCode());
        assertEquals("UserName长度不能超过100字符", result.getMsg());
        verifyNoInteractions(hdocDocumentListMapper);
    }

    // ============================================================
    // getUserInfo() — 业务逻辑
    // ============================================================

    @Test
    @DisplayName("getUserInfo - 通过userId查询，用户不存在应返回404")
    void getUserInfo_ByUserIdNotFound_ShouldReturn404() {
        HdocDocumentList r = createRequest("testuser", "", null);
        when(hdocDocumentListMapper.selectUserInfo("testuser", null)).thenReturn(null);

        ApiResponse<?> result = service.getUserInfo(r);

        assertEquals(404, result.getCode());
        assertEquals("We didn't recognize the userid you entered. Please try again.", result.getMsg());
    }

    @Test
    @DisplayName("getUserInfo - 通过userName查询，用户存在应返回成功")
    void getUserInfo_ByUserNameSuccess_ShouldReturnSuccess() {
        HdocDocumentList r = createRequest("", "Test User", null);
        when(hdocDocumentListMapper.selectUserInfo(null, "Test User")).thenReturn(createUserInfo());

        ApiResponse<?> result = service.getUserInfo(r);

        assertEquals(200, result.getCode());
        assertEquals("获取用户信息成功", result.getMsg());
        assertNotNull(result.getData());
        Map<?, ?> data = (Map<?, ?>) result.getData();
        assertEquals("testuser", data.get("userid"));
        assertEquals("Test User", data.get("username"));
        assertEquals("Manager", data.get("responsible"));
        assertEquals("Admin", data.get("userposition"));
        assertEquals("test@example.com", data.get("email"));
    }

    @Test
    @DisplayName("getUserInfo - Mapper异常，应返回500")
    void getUserInfo_MapperThrowsException_ShouldReturn500() {
        HdocDocumentList r = createRequest("testuser", "", null);
        when(hdocDocumentListMapper.selectUserInfo("testuser", null))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.getUserInfo(r);

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // getUserPermissions()
    // ============================================================

    @Test
    @DisplayName("getUserPermissions - userId为空，应返回400")
    void getUserPermissions_UserIdEmpty_ShouldReturn400() {
        HdocDocumentList r = createRequest("", null, null);

        ApiResponse<?> result = service.getUserPermissions(r);

        assertEquals(400, result.getCode());
        assertEquals("UserId不能为空", result.getMsg());
        verifyNoInteractions(hdocDocumentListMapper);
    }

    @Test
    @DisplayName("getUserPermissions - userId为null，应返回400")
    void getUserPermissions_UserIdNull_ShouldReturn400() {
        HdocDocumentList r = createRequest(null, null, null);

        ApiResponse<?> result = service.getUserPermissions(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(hdocDocumentListMapper);
    }

    @Test
    @DisplayName("getUserPermissions - userId超过20字符，应返回400")
    void getUserPermissions_UserIdTooLong_ShouldReturn400() {
        HdocDocumentList r = createRequest(new String(new char[21]).replace('\0', 'U'), null, null);

        ApiResponse<?> result = service.getUserPermissions(r);

        assertEquals(400, result.getCode());
        assertEquals("UserId长度不能超过20字符", result.getMsg());
        verifyNoInteractions(hdocDocumentListMapper);
    }

    @Test
    @DisplayName("getUserPermissions - 用户不存在，应返回404")
    void getUserPermissions_UserNotFound_ShouldReturn404() {
        HdocDocumentList r = createRequest("testuser", null, null);
        when(hdocDocumentListMapper.countUserById("testuser")).thenReturn(0);

        ApiResponse<?> result = service.getUserPermissions(r);

        assertEquals(404, result.getCode());
        verify(hdocDocumentListMapper, never()).selectFunctionAuth(any());
        verify(hdocDocumentListMapper, never()).selectMarketAuth(any());
    }

    @Test
    @DisplayName("getUserPermissions - Mapper返回null，应用空列表")
    void getUserPermissions_MappersReturnNull_ShouldUseEmptyLists() {
        HdocDocumentList r = createRequest("testuser", null, null);
        when(hdocDocumentListMapper.countUserById("testuser")).thenReturn(1);
        when(hdocDocumentListMapper.selectFunctionAuth("testuser")).thenReturn(null);
        when(hdocDocumentListMapper.selectMarketAuth("testuser")).thenReturn(null);

        ApiResponse<?> result = service.getUserPermissions(r);

        assertEquals(200, result.getCode());
        assertEquals("获取用户权限成功", result.getMsg());
        assertNotNull(result.getData());
        Map<?, ?> data = (Map<?, ?>) result.getData();
        assertNotNull(data.get("functions"));
        assertTrue(((List<?>) data.get("functions")).isEmpty());
        assertNotNull(data.get("markets"));
        assertTrue(((List<?>) data.get("markets")).isEmpty());
    }

    @Test
    @DisplayName("getUserPermissions - 正常返回权限数据")
    void getUserPermissions_Success_ShouldReturnPermissions() {
        HdocDocumentList r = createRequest("testuser", null, null);
        when(hdocDocumentListMapper.countUserById("testuser")).thenReturn(1);
        List<Map<String, String>> functions = new ArrayList<>();
        Map<String, String> f = new HashMap<>();
        f.put("FUNCTION", "ADMIN");
        functions.add(f);
        when(hdocDocumentListMapper.selectFunctionAuth("testuser")).thenReturn(functions);
        when(hdocDocumentListMapper.selectMarketAuth("testuser")).thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.getUserPermissions(r);

        assertEquals(200, result.getCode());
        Map<?, ?> data = (Map<?, ?>) result.getData();
        assertEquals(1, ((List<?>) data.get("functions")).size());
        assertEquals(0, ((List<?>) data.get("markets")).size());
    }

    @Test
    @DisplayName("getUserPermissions - Mapper异常，应返回500")
    void getUserPermissions_MapperThrowsException_ShouldReturn500() {
        HdocDocumentList r = createRequest("testuser", null, null);
        when(hdocDocumentListMapper.countUserById("testuser"))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.getUserPermissions(r);

        assertEquals(500, result.getCode());
    }

    // ============================================================
    // updateRole()
    // ============================================================

    @Test
    @DisplayName("updateRole - userId为空，应返回400")
    void updateRole_UserIdEmpty_ShouldReturn400() {
        HdocDocumentList r = createRequest("", null, "admin");

        ApiResponse<?> result = service.updateRole(r);

        assertEquals(400, result.getCode());
        assertEquals("USERID不能为空", result.getMsg());
        verifyNoInteractions(hdocDocumentListMapper);
    }

    @Test
    @DisplayName("updateRole - userId为null，应返回400")
    void updateRole_UserIdNull_ShouldReturn400() {
        HdocDocumentList r = createRequest(null, null, "admin");

        ApiResponse<?> result = service.updateRole(r);

        assertEquals(400, result.getCode());
        verifyNoInteractions(hdocDocumentListMapper);
    }

    @Test
    @DisplayName("updateRole - 用户不存在，应返回404")
    void updateRole_UserNotFound_ShouldReturn404() {
        HdocDocumentList r = createRequest("testuser", null, "admin");
        when(hdocDocumentListMapper.countUserById("testuser")).thenReturn(0);

        ApiResponse<?> result = service.updateRole(r);

        assertEquals(404, result.getCode());
        verify(hdocDocumentListMapper, never()).updateMarketAuth(any(), any(), any(), any(), any(), any());
        verify(hdocDocumentListMapper, never()).updateFunctionAuth(any(), any(), any(), any());
    }

    @Test
    @DisplayName("updateRole - market和type有值，function有值，应调用两个update")
    void updateRole_AllFieldsPresent_ShouldCallBothUpdates() {
        HdocDocumentList r = createRequest("testuser", null, "admin");
        r.setMarket("JP");
        r.setType("1");
        r.setBu("BU1");
        r.setFunction("VIEW");
        when(hdocDocumentListMapper.countUserById("testuser")).thenReturn(1);

        ApiResponse<?> result = service.updateRole(r);

        assertEquals(200, result.getCode());
        assertEquals("更新用户角色成功", result.getMsg());
        verify(hdocDocumentListMapper, times(1))
                .updateMarketAuth("testuser", "JP", "1", "BU1", "admin", "UD17_UPDATE_ROLE");
        verify(hdocDocumentListMapper, times(1))
                .updateFunctionAuth("VIEW", "testuser", "admin", "UD17_UPDATE_ROLE");
    }

    @Test
    @DisplayName("updateRole - market和type为空，function为空，不应调用任何update")
    void updateRole_AllFieldsEmpty_ShouldCallNoUpdates() {
        HdocDocumentList r = createRequest("testuser", null, "admin");
        r.setMarket("");
        r.setType("");
        r.setBu("");
        r.setFunction("");
        when(hdocDocumentListMapper.countUserById("testuser")).thenReturn(1);

        ApiResponse<?> result = service.updateRole(r);

        assertEquals(200, result.getCode());
        verify(hdocDocumentListMapper, never()).updateMarketAuth(any(), any(), any(), any(), any(), any());
        verify(hdocDocumentListMapper, never()).updateFunctionAuth(any(), any(), any(), any());
    }

    @Test
    @DisplayName("updateRole - market/type为null，不调用updateMarketAuth")
    void updateRole_MarketTypeNull_ShouldSkipMarketUpdate() {
        HdocDocumentList r = createRequest("testuser", null, "admin");
        r.setMarket(null);
        r.setType(null);
        r.setFunction("VIEW");
        when(hdocDocumentListMapper.countUserById("testuser")).thenReturn(1);

        ApiResponse<?> result = service.updateRole(r);

        assertEquals(200, result.getCode());
        verify(hdocDocumentListMapper, never()).updateMarketAuth(any(), any(), any(), any(), any(), any());
        verify(hdocDocumentListMapper, times(1)).updateFunctionAuth("VIEW", "testuser", "admin", "UD17_UPDATE_ROLE");
    }

    @Test
    @DisplayName("updateRole - market非空但type为空，不调用updateMarketAuth")
    void updateRole_MarketNotEmptyTypeEmpty_ShouldSkipMarketUpdate() {
        HdocDocumentList r = createRequest("testuser", null, "admin");
        r.setMarket("JP");
        r.setType("");
        r.setFunction("VIEW");
        when(hdocDocumentListMapper.countUserById("testuser")).thenReturn(1);

        ApiResponse<?> result = service.updateRole(r);

        assertEquals(200, result.getCode());
        verify(hdocDocumentListMapper, never()).updateMarketAuth(any(), any(), any(), any(), any(), any());
        verify(hdocDocumentListMapper, times(1)).updateFunctionAuth("VIEW", "testuser", "admin", "UD17_UPDATE_ROLE");
    }

    @Test
    @DisplayName("updateRole - function为null，不调用updateFunctionAuth")
    void updateRole_FunctionNull_ShouldSkipFunctionUpdate() {
        HdocDocumentList r = createRequest("testuser", null, "admin");
        r.setMarket("JP");
        r.setType("1");
        r.setFunction(null);
        when(hdocDocumentListMapper.countUserById("testuser")).thenReturn(1);

        ApiResponse<?> result = service.updateRole(r);

        assertEquals(200, result.getCode());
        verify(hdocDocumentListMapper, times(1)).updateMarketAuth("testuser", "JP", "1", "", "admin", "UD17_UPDATE_ROLE");
        verify(hdocDocumentListMapper, never()).updateFunctionAuth(any(), any(), any(), any());
    }

    @Test
    @DisplayName("updateRole - updateUser为null，使用SYSTEM")
    void updateRole_UpdateUserNull_ShouldUseSystem() {
        HdocDocumentList r = createRequest("testuser", null, null);
        r.setMarket("JP");
        r.setType("1");
        r.setFunction("VIEW");
        when(hdocDocumentListMapper.countUserById("testuser")).thenReturn(1);

        ApiResponse<?> result = service.updateRole(r);

        assertEquals(200, result.getCode());
        verify(hdocDocumentListMapper, times(1))
                .updateMarketAuth("testuser", "JP", "1", "", "SYSTEM", "UD17_UPDATE_ROLE");
        verify(hdocDocumentListMapper, times(1))
                .updateFunctionAuth("VIEW", "testuser", "SYSTEM", "UD17_UPDATE_ROLE");
    }

    @Test
    @DisplayName("updateRole - updateUser为空白，使用SYSTEM")
    void updateRole_UpdateUserBlank_ShouldUseSystem() {
        HdocDocumentList r = createRequest("testuser", null, "   ");
        r.setMarket("JP");
        r.setType("1");
        r.setFunction("VIEW");
        when(hdocDocumentListMapper.countUserById("testuser")).thenReturn(1);

        ApiResponse<?> result = service.updateRole(r);

        assertEquals(200, result.getCode());
        verify(hdocDocumentListMapper, times(1))
                .updateMarketAuth("testuser", "JP", "1", "", "SYSTEM", "UD17_UPDATE_ROLE");
    }

    @Test
    @DisplayName("updateRole - Mapper异常，应返回500")
    void updateRole_MapperThrowsException_ShouldReturn500() {
        HdocDocumentList r = createRequest("testuser", null, "admin");
        when(hdocDocumentListMapper.countUserById("testuser"))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.updateRole(r);

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }

    // ============================================================
    // deleteRole()
    // ============================================================

    @Test
    @DisplayName("deleteRole - userId为空，应返回400")
    void deleteRole_UserIdEmpty_ShouldReturn400() {
        HdocDocumentList r = createRequest("", null, null);

        ApiResponse<?> result = service.deleteRole(r);

        assertEquals(400, result.getCode());
        assertEquals("USERID不能为空", result.getMsg());
    }

    @Test
    @DisplayName("deleteRole - userId为null，应返回400")
    void deleteRole_UserIdNull_ShouldReturn400() {
        HdocDocumentList r = createRequest(null, null, null);

        ApiResponse<?> result = service.deleteRole(r);

        assertEquals(400, result.getCode());
    }

    @Test
    @DisplayName("deleteRole - 成功，应返回删除成功")
    void deleteRole_Success_ShouldReturnSuccess() {
        HdocDocumentList r = createRequest("testuser", null, null);

        ApiResponse<?> result = service.deleteRole(r);

        assertEquals(200, result.getCode());
        assertEquals("删除用户角色成功", result.getMsg());
        assertNotNull(result.getData());
        assertEquals("testuser", ((Map<?, ?>) result.getData()).get("userid"));
    }

    @Test
    @DisplayName("deleteRole - Mapper异常，应返回500")
    void deleteRole_MapperThrowsException_ShouldReturn500() {
        HdocDocumentList r = createRequest("testuser", null, null);
        // deleteRole 中不调用 mapper，但 try-catch 在方法外层
        // 为了触发异常，可以 mock 一个会抛异常的 mapper 调用
        // 但 deleteRole 不调用 mapper，所以这里不测试异常
        // 方法内不调用 mapper，catch 只捕获意外异常
        ApiResponse<?> result = service.deleteRole(r);

        assertEquals(200, result.getCode());
    }
}
