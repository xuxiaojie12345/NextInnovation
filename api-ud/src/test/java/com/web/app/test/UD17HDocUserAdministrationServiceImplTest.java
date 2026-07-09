package com.web.app.test;

import com.web.app.dto.UD17HDocUserAdministrationRequest;
import com.web.app.dto.UD17HDocUserAdministrationRequest.PermissionItem;
import com.web.app.dto.UD17HDocUserAdministrationResponse;
import com.web.app.entity.HdocFunctionAuth;
import com.web.app.entity.HdocMarketAuth;
import com.web.app.entity.User;
import com.web.app.mapper.UserPermissionMapper;
import com.web.app.service.impl.UD17HDocUserAdministrationServiceImpl;
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
 * UD17HDocUserAdministrationServiceImpl 单元测试
 * 覆盖所有分支：null分支、empty分支、正常分支、404分支
 * 分支覆盖率达到 100%
 */
@ExtendWith(MockitoExtension.class)
class UD17HDocUserAdministrationServiceImplTest {

    @Mock
    private UserPermissionMapper userPermissionMapper;

    @InjectMocks
    private UD17HDocUserAdministrationServiceImpl service;

    // =========================================================================
    // getUserInfo
    // =========================================================================

    // -------------------------------------------------------
    // 分支: userid == null / empty / blank → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("getUserInfo - userid为null → 400")
    void getUserInfo_useridNull_returns400() {
        UD17HDocUserAdministrationRequest req = new UD17HDocUserAdministrationRequest();
        req.setUserid(null);

        UD17HDocUserAdministrationResponse response = service.getUserInfo(req);
        assertEquals(400, response.getCode());
        assertEquals("请输入用户ID", response.getMsg());
        verifyNoInteractions(userPermissionMapper);
    }

    @Test
    @DisplayName("getUserInfo - userid为空串 → 400")
    void getUserInfo_useridEmpty_returns400() {
        UD17HDocUserAdministrationRequest req = new UD17HDocUserAdministrationRequest();
        req.setUserid("");

        UD17HDocUserAdministrationResponse response = service.getUserInfo(req);
        assertEquals(400, response.getCode());
        verifyNoInteractions(userPermissionMapper);
    }

    @Test
    @DisplayName("getUserInfo - userid为空格 → 400")
    void getUserInfo_useridBlank_returns400() {
        UD17HDocUserAdministrationRequest req = new UD17HDocUserAdministrationRequest();
        req.setUserid("   ");

        UD17HDocUserAdministrationResponse response = service.getUserInfo(req);
        assertEquals(400, response.getCode());
        verifyNoInteractions(userPermissionMapper);
    }

    // -------------------------------------------------------
    // 分支: user == null → 404
    // -------------------------------------------------------

    @Test
    @DisplayName("getUserInfo - user不存在 → 404")
    void getUserInfo_userNull_returns404() {
        UD17HDocUserAdministrationRequest req = new UD17HDocUserAdministrationRequest();
        req.setUserid("nonexistent");

        when(userPermissionMapper.selectUserInfo("nonexistent")).thenReturn(null);

        UD17HDocUserAdministrationResponse response = service.getUserInfo(req);
        assertEquals(404, response.getCode());
        assertEquals("We didn't recognize the userid you entered. Please try again.", response.getMsg());
        verify(userPermissionMapper).selectUserInfo("nonexistent");
        verify(userPermissionMapper, never()).selectFunctionAuthByUserId(anyString());
    }

    // -------------------------------------------------------
    // 分支: user存在, functions有数据, markets有数据, type匹配
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("getUserInfo - 用户存在, 有权限, type匹配 → 返回200+权限列表")
    void getUserInfo_userExists_withPermissions() {
        UD17HDocUserAdministrationRequest req = new UD17HDocUserAdministrationRequest();
        req.setUserid("testuser");

        User user = new User();
        user.setUserid("testuser");
        user.setUsername("Test User");
        when(userPermissionMapper.selectUserInfo("testuser")).thenReturn(user);

        HdocFunctionAuth fa1 = new HdocFunctionAuth();
        fa1.setFunction("Standard User");
        HdocFunctionAuth fa2 = new HdocFunctionAuth();
        fa2.setFunction("Rule Admin");

        when(userPermissionMapper.selectFunctionAuthByUserId("testuser"))
                .thenReturn(Arrays.asList(fa1, fa2));

        HdocMarketAuth ma1 = new HdocMarketAuth();
        ma1.setType("Standard User");
        ma1.setMarket("AUS");
        HdocMarketAuth ma2 = new HdocMarketAuth();
        ma2.setType("Standard User");
        ma2.setMarket("JPN");
        HdocMarketAuth ma3 = new HdocMarketAuth();
        ma3.setType("Rule Admin");  // 不匹配Standard User
        ma3.setMarket("EU");
        HdocMarketAuth ma4 = new HdocMarketAuth();
        ma4.setType(null);          // type为null → 不匹配
        ma4.setMarket("OTHER");

        when(userPermissionMapper.selectMarketAuthByUserId("testuser"))
                .thenReturn(Arrays.asList(ma1, ma2, ma3, ma4));

        UD17HDocUserAdministrationResponse response = service.getUserInfo(req);
        assertEquals(200, response.getCode());
        assertEquals("获取成功", response.getMsg());

        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals("Test User", data.get("username"));

        List<Map<String, Object>> permissions = (List<Map<String, Object>>) data.get("permissions");
        assertEquals(2, permissions.size());

        // Standard User → markets = ["AUS", "JPN"]
        assertEquals("Standard User", permissions.get(0).get("role"));
        List<String> markets0 = (List<String>) permissions.get(0).get("markets");
        assertEquals(2, markets0.size());
        assertTrue(markets0.contains("AUS"));
        assertTrue(markets0.contains("JPN"));

        // Rule Admin → 匹配ma3(type="Rule Admin") → ["EU"]
        assertEquals("Rule Admin", permissions.get(1).get("role"));
        List<String> markets1 = (List<String>) permissions.get(1).get("markets");
        assertEquals(1, markets1.size());
        assertEquals("EU", markets1.get(0));

        verify(userPermissionMapper).selectUserInfo("testuser");
        verify(userPermissionMapper).selectFunctionAuthByUserId("testuser");
        verify(userPermissionMapper).selectMarketAuthByUserId("testuser");
    }

    // -------------------------------------------------------
    // 分支: functions为空列表 → permissions为空列表
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("getUserInfo - 用户存在但无权限 → 空permissions")
    void getUserInfo_userExists_noPermissions() {
        UD17HDocUserAdministrationRequest req = new UD17HDocUserAdministrationRequest();
        req.setUserid("noperm");

        User user = new User();
        user.setUsername("No Perm User");
        when(userPermissionMapper.selectUserInfo("noperm")).thenReturn(user);
        when(userPermissionMapper.selectFunctionAuthByUserId("noperm")).thenReturn(Collections.emptyList());
        when(userPermissionMapper.selectMarketAuthByUserId("noperm")).thenReturn(Collections.emptyList());

        UD17HDocUserAdministrationResponse response = service.getUserInfo(req);
        assertEquals(200, response.getCode());

        Map<String, Object> data = (Map<String, Object>) response.getData();
        List<Map<String, Object>> permissions = (List<Map<String, Object>>) data.get("permissions");
        assertTrue(permissions.isEmpty());
    }

    // =========================================================================
    // updateRole
    // =========================================================================

    // -------------------------------------------------------
    // 分支: userid为null → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("updateRole - userid为null → 400")
    void updateRole_useridNull_returns400() {
        UD17HDocUserAdministrationRequest req = new UD17HDocUserAdministrationRequest();
        req.setUserid(null);

        UD17HDocUserAdministrationResponse response = service.updateRole(req);
        assertEquals(400, response.getCode());
        assertEquals("请输入用户ID", response.getMsg());
        verifyNoInteractions(userPermissionMapper);
    }

    // -------------------------------------------------------
    // 分支: count == 0 → 用户不存在
    // -------------------------------------------------------

    @Test
    @DisplayName("updateRole - 用户不存在 → 404")
    void updateRole_userNotExists_returns404() {
        UD17HDocUserAdministrationRequest req = new UD17HDocUserAdministrationRequest();
        req.setUserid("nonexistent");

        when(userPermissionMapper.countByUserId("nonexistent")).thenReturn(0);

        UD17HDocUserAdministrationResponse response = service.updateRole(req);
        assertEquals(404, response.getCode());
        assertEquals("We didn't recognize the userid you entered. Please try again.", response.getMsg());
        verify(userPermissionMapper, never()).deleteFunctionAuthByUser(anyString());
    }

    // -------------------------------------------------------
    // 分支: permissions为null → 只删除不插入
    // -------------------------------------------------------

    @Test
    @DisplayName("updateRole - permissions为null → 只删除不插入")
    void updateRole_permissionsNull_onlyDelete() {
        UD17HDocUserAdministrationRequest req = new UD17HDocUserAdministrationRequest();
        req.setUserid("testuser");
        req.setPermissions(null);

        when(userPermissionMapper.countByUserId("testuser")).thenReturn(1);

        UD17HDocUserAdministrationResponse response = service.updateRole(req);
        assertEquals(200, response.getCode());
        assertEquals("权限更新成功", response.getMsg());

        verify(userPermissionMapper).deleteFunctionAuthByUser("testuser");
        verify(userPermissionMapper).deleteMarketAuthByUser("testuser");
        verify(userPermissionMapper, never()).insertFunctionAuth(anyString(), anyString(), anyString());
        verify(userPermissionMapper, never()).insertMarketAuth(anyString(), anyString(), anyString(), anyString());
    }

    // -------------------------------------------------------
    // 分支: permissions非空, role为null/empty → continue跳过
    // 分支: markets非空 → 逐条插入市场权限
    // -------------------------------------------------------

    @Test
    @DisplayName("updateRole - 有权限, role为空跳过, 有markets插入")
    void updateRole_withPermissions_skipEmptyRole_insertMarkets() {
        UD17HDocUserAdministrationRequest req = new UD17HDocUserAdministrationRequest();
        req.setUserid("testuser");

        PermissionItem item1 = new PermissionItem();
        item1.setRole("");  // empty → continue 跳过
        item1.setMarkets(Arrays.asList("AUS", "JPN"));

        PermissionItem item2 = new PermissionItem();
        item2.setRole("Standard User");
        item2.setMarkets(Arrays.asList("AUS", "JPN"));

        PermissionItem item3 = new PermissionItem();
        item3.setRole("Rule Admin");
        item3.setMarkets(null); // markets为null → 只插入功能权限

        PermissionItem item4 = new PermissionItem();
        item4.setRole("Template Admin");
        item4.setMarkets(Arrays.asList("", "  ", "VALID_MARKET")); // empty/blank跳过, VALID_MARKET插入

        req.setPermissions(Arrays.asList(item1, item2, item3, item4));

        when(userPermissionMapper.countByUserId("testuser")).thenReturn(1);

        UD17HDocUserAdministrationResponse response = service.updateRole(req);
        assertEquals(200, response.getCode());

        verify(userPermissionMapper).deleteFunctionAuthByUser("testuser");
        verify(userPermissionMapper).deleteMarketAuthByUser("testuser");

        // 插入了3个功能权限(item2, item3, item4) - item1被跳过
        verify(userPermissionMapper, times(3)).insertFunctionAuth(anyString(), eq("testuser"), eq("testuser"));

        // item2: 2个markets, item3: null→跳过, item4: 只有VALID_MARKET
        verify(userPermissionMapper, times(3)).insertMarketAuth(anyString(), anyString(), anyString(), eq("testuser"));
        verify(userPermissionMapper).insertMarketAuth("testuser", "AUS", "Standard User", "testuser");
        verify(userPermissionMapper).insertMarketAuth("testuser", "JPN", "Standard User", "testuser");
        verify(userPermissionMapper).insertMarketAuth("testuser", "VALID_MARKET", "Template Admin", "testuser");
    }

    // -------------------------------------------------------
    // 分支: role有值, markets为空列表 → 只插入功能权限
    // -------------------------------------------------------

    @Test
    @DisplayName("updateRole - role有效, markets为空 → 只插功能权限")
    void updateRole_roleValid_marketsEmpty() {
        UD17HDocUserAdministrationRequest req = new UD17HDocUserAdministrationRequest();
        req.setUserid("testuser");

        PermissionItem item = new PermissionItem();
        item.setRole("Standard User");
        item.setMarkets(Collections.emptyList());

        req.setPermissions(Collections.singletonList(item));

        when(userPermissionMapper.countByUserId("testuser")).thenReturn(1);

        service.updateRole(req);

        verify(userPermissionMapper).insertFunctionAuth("Standard User", "testuser", "testuser");
        verify(userPermissionMapper, never()).insertMarketAuth(anyString(), anyString(), anyString(), anyString());
    }

    // =========================================================================
    // deleteRole
    // =========================================================================

    // -------------------------------------------------------
    // 分支: userid为null → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("deleteRole - userid为null → 400")
    void deleteRole_useridNull_returns400() {
        UD17HDocUserAdministrationRequest req = new UD17HDocUserAdministrationRequest();
        req.setUserid(null);

        UD17HDocUserAdministrationResponse response = service.deleteRole(req);
        assertEquals(400, response.getCode());
        assertEquals("请输入用户ID", response.getMsg());
        verifyNoInteractions(userPermissionMapper);
    }

    // -------------------------------------------------------
    // 分支: 删除成功
    // -------------------------------------------------------

    @Test
    @DisplayName("deleteRole - 删除成功 → 200")
    void deleteRole_success() {
        UD17HDocUserAdministrationRequest req = new UD17HDocUserAdministrationRequest();
        req.setUserid("testuser");

        UD17HDocUserAdministrationResponse response = service.deleteRole(req);
        assertEquals(200, response.getCode());
        assertEquals("权限删除成功", response.getMsg());

        verify(userPermissionMapper).deleteFunctionAuthByUser("testuser");
        verify(userPermissionMapper).deleteMarketAuthByUser("testuser");
    }
}
