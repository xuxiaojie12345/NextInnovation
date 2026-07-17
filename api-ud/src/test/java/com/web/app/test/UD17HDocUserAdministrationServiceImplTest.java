package com.web.app.test;

import com.web.app.dto.UD17HDocUserAdministrationRequest;
import com.web.app.dto.UD17HDocUserAdministrationRequest.FunctionAuthItem;
import com.web.app.dto.UD17HDocUserAdministrationResponse;
import com.web.app.mapper.UD17HDocUserAdministrationMapper;
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
 * 覆盖所有方法的所有分支（含 mapFunctionToTypeCode 全部 switch 分支），达到 100% JaCoCo 覆盖率
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD17HDocUserAdministrationServiceImpl 单元测试")
class UD17HDocUserAdministrationServiceImplTest {

    @Mock
    private UD17HDocUserAdministrationMapper ud17Mapper;

    @InjectMocks
    private UD17HDocUserAdministrationServiceImpl service;

    private static final String USERID = "testuser";
    private static final String USER_NAME = "测试用户";

    // ====================================================================
    // mapFunctionToTypeCode 测试（private，通过 UpdateRole 间接验证）
    // ====================================================================

    // ====================================================================
    // validateUserId 公共校验（被所有方法调用）
    // ====================================================================

    // ====================================================================
    // UD17Userinfo 测试
    // ====================================================================

    @Test
    @DisplayName("[Userinfo] userid 为 null 时应返回400")
    void testUserinfo_UseridNull() {
        UD17HDocUserAdministrationResponse response = service.UD17Userinfo(new UD17HDocUserAdministrationRequest());
        assertEquals("400", response.getCode());
        assertFalse(response.getSuccess());
        assertEquals("用户ID不能为空", response.getMessage());
    }

    @Test
    @DisplayName("[Userinfo] userid 为空字符串时应返回400")
    void testUserinfo_UseridEmpty() {
        UD17HDocUserAdministrationRequest request = new UD17HDocUserAdministrationRequest();
        request.setUserid("");
        UD17HDocUserAdministrationResponse response = service.UD17Userinfo(request);
        assertEquals("400", response.getCode());
        assertEquals("用户ID不能为空", response.getMessage());
    }

    @Test
    @DisplayName("[Userinfo] 用户不存在时应返回404")
    void testUserinfo_UserNotFound() {
        when(ud17Mapper.selectUserNameByUserid(USERID)).thenReturn(null);

        UD17HDocUserAdministrationResponse response = service.UD17Userinfo(createRequest(USERID));

        assertEquals("404", response.getCode());
        assertFalse(response.getSuccess());
        assertEquals("用户不存在", response.getMessage());
        verify(ud17Mapper, times(1)).selectUserNameByUserid(USERID);
        verify(ud17Mapper, never()).selectAuthListByUserid(any());
    }

    @Test
    @DisplayName("[Userinfo] authMapList 为 null 时应返回空权限列表")
    void testUserinfo_AuthMapListNull() {
        when(ud17Mapper.selectUserNameByUserid(USERID)).thenReturn(USER_NAME);
        when(ud17Mapper.selectAuthListByUserid(USERID)).thenReturn(null);

        UD17HDocUserAdministrationResponse response = service.UD17Userinfo(createRequest(USERID));

        assertEquals("200", response.getCode());
        assertTrue(response.getSuccess());
        assertEquals("查询成功", response.getMessage());
        assertEquals(USERID, response.getUserId());
        assertEquals(USER_NAME, response.getUserName());
        assertNotNull(response.getAuthList());
        assertTrue(response.getAuthList().isEmpty());
        verify(ud17Mapper, times(1)).selectUserNameByUserid(USERID);
        verify(ud17Mapper, times(1)).selectAuthListByUserid(USERID);
    }

    @Test
    @DisplayName("[Userinfo] 查询成功时应返回用户信息及权限列表")
    void testUserinfo_Success() {
        when(ud17Mapper.selectUserNameByUserid(USERID)).thenReturn(USER_NAME);

        Map<String, Object> authMap1 = new HashMap<>();
        authMap1.put("market", "-EU");
        authMap1.put("type", "U");
        authMap1.put("bu", "UD");
        Map<String, Object> authMap2 = new HashMap<>();
        authMap2.put("market", "JP");
        authMap2.put("type", "R");
        authMap2.put("bu", "UD");
        when(ud17Mapper.selectAuthListByUserid(USERID)).thenReturn(Arrays.asList(authMap1, authMap2));

        UD17HDocUserAdministrationResponse response = service.UD17Userinfo(createRequest(USERID));

        assertEquals("200", response.getCode());
        assertTrue(response.getSuccess());
        assertEquals(USERID, response.getUserId());
        assertEquals(USER_NAME, response.getUserName());
        assertEquals(2, response.getAuthList().size());
        assertEquals("-EU", response.getAuthList().get(0).getMarket());
        assertEquals("U", response.getAuthList().get(0).getType());
        assertEquals("UD", response.getAuthList().get(0).getBu());
        assertEquals("JP", response.getAuthList().get(1).getMarket());
        assertEquals("R", response.getAuthList().get(1).getType());
        verify(ud17Mapper, times(1)).selectUserNameByUserid(USERID);
        verify(ud17Mapper, times(1)).selectAuthListByUserid(USERID);
    }

    @Test
    @DisplayName("[Userinfo] 系统异常时应返回500")
    void testUserinfo_Exception() {
        when(ud17Mapper.selectUserNameByUserid(anyString()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD17HDocUserAdministrationResponse response = service.UD17Userinfo(createRequest(USERID));

        assertEquals("500", response.getCode());
        assertFalse(response.getSuccess());
        assertEquals("系统繁忙，请稍后重试", response.getMessage());
        verify(ud17Mapper, times(1)).selectUserNameByUserid(USERID);
    }

    // ====================================================================
    // UD17UpdateRole 测试
    // ====================================================================

    @Test
    @DisplayName("[UpdateRole] userid 为 null 时应返回400")
    void testUpdateRole_UseridNull() {
        UD17HDocUserAdministrationResponse response = service.UD17UpdateRole(new UD17HDocUserAdministrationRequest());
        assertEquals("400", response.getCode());
        assertEquals("用户ID不能为空", response.getMessage());
    }

    @Test
    @DisplayName("[UpdateRole] 用户不存在时应返回404")
    void testUpdateRole_UserNotFound() {
        when(ud17Mapper.selectUserNameByUserid(USERID)).thenReturn(null);

        UD17HDocUserAdministrationResponse response = service.UD17UpdateRole(createRequest(USERID));

        assertEquals("404", response.getCode());
        assertEquals("用户不存在", response.getMessage());
        verify(ud17Mapper, times(1)).selectUserNameByUserid(USERID);
    }

    @Test
    @DisplayName("[UpdateRole] authList 为 null 时应跳过循环直接更新成功")
    void testUpdateRole_AuthListNull() {
        when(ud17Mapper.selectUserNameByUserid(USERID)).thenReturn(USER_NAME);

        UD17HDocUserAdministrationRequest request = createRequest(USERID);
        request.setFunctionAuths(null);

        UD17HDocUserAdministrationResponse response = service.UD17UpdateRole(request);

        assertEquals("200", response.getCode());
        assertTrue(response.getSuccess());
        assertEquals("用户权限更新成功", response.getMessage());
        verify(ud17Mapper, times(1)).deleteFunctionAuthByUserid(USERID);
        verify(ud17Mapper, times(1)).deleteMarketAuthByUserid(USERID);
        verify(ud17Mapper, never()).insertFunctionAuth(any(), any(), any(), any(), any(), any());
        verify(ud17Mapper, never()).insertMarketAuth(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("[UpdateRole] authList 为空列表时应跳过循环直接更新成功")
    void testUpdateRole_AuthListEmpty() {
        when(ud17Mapper.selectUserNameByUserid(USERID)).thenReturn(USER_NAME);

        UD17HDocUserAdministrationRequest request = createRequest(USERID);
        request.setFunctionAuths(new ArrayList<>());

        UD17HDocUserAdministrationResponse response = service.UD17UpdateRole(request);

        assertEquals("200", response.getCode());
        assertEquals("用户权限更新成功", response.getMessage());
        verify(ud17Mapper, times(1)).deleteFunctionAuthByUserid(USERID);
        verify(ud17Mapper, times(1)).deleteMarketAuthByUserid(USERID);
        verify(ud17Mapper, never()).insertFunctionAuth(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("[UpdateRole] 插入成功：含 FUNCTION 和市场权限（含 typeCode 映射各种分支）")
    void testUpdateRole_Success() {
        when(ud17Mapper.selectUserNameByUserid(USERID)).thenReturn(USER_NAME);

        List<FunctionAuthItem> authList = Arrays.asList(
                new FunctionAuthItem("USER", "-EU"),
                new FunctionAuthItem("RULES", "JP"),
                new FunctionAuthItem("TEMPLATE", "AUS"),
                new FunctionAuthItem("Document", "US"),
                new FunctionAuthItem("User Administrator", "CN"),
                new FunctionAuthItem("ADAPTATION DOC", "DE"),
                new FunctionAuthItem("market super user", "FR"),
                new FunctionAuthItem("UNKNOWN_FUNC", "UK"));

        UD17HDocUserAdministrationRequest request = createRequest(USERID);
        request.setFunctionAuths(authList);

        UD17HDocUserAdministrationResponse response = service.UD17UpdateRole(request);

        assertEquals("200", response.getCode());
        assertEquals("用户权限更新成功", response.getMessage());

        // 验证 delete 调用
        verify(ud17Mapper, times(1)).deleteFunctionAuthByUserid(USERID);
        verify(ud17Mapper, times(1)).deleteMarketAuthByUserid(USERID);

        // 验证 insertFunctionAuth 调用（8个不同的FUNCTION）
        verify(ud17Mapper, times(8)).insertFunctionAuth(any(), any(), any(), any(), any(), any());

        // 验证 insertMarketAuth 调用的 typeCode 映射
        verify(ud17Mapper).insertMarketAuth(eq(USERID), eq("-EU"), eq("U"), any(), any(), any(), any());
        verify(ud17Mapper).insertMarketAuth(eq(USERID), eq("JP"), eq("R"), any(), any(), any(), any());
        verify(ud17Mapper).insertMarketAuth(eq(USERID), eq("AUS"), eq("T"), any(), any(), any(), any());
        verify(ud17Mapper).insertMarketAuth(eq(USERID), eq("US"), eq("D"), any(), any(), any(), any());
        verify(ud17Mapper).insertMarketAuth(eq(USERID), eq("CN"), eq("A"), any(), any(), any(), any());
        verify(ud17Mapper).insertMarketAuth(eq(USERID), eq("DE"), eq("DOCMOD"), any(), any(), any(), any());
        verify(ud17Mapper).insertMarketAuth(eq(USERID), eq("FR"), eq("MCSU"), any(), any(), any(), any());
        verify(ud17Mapper).insertMarketAuth(eq(USERID), eq("UK"), eq("UNKNOWN_FUNC"), any(), any(), any(), any());
    }

    @Test
    @DisplayName("[UpdateRole] 重复 FUNCTION 应跳过，market 为 null 时应跳过市场权限插入")
    void testUpdateRole_DuplicateFunctionAndNullMarket() {
        when(ud17Mapper.selectUserNameByUserid(USERID)).thenReturn(USER_NAME);

        // 两个相同的 FUNCTION，且 market 为 null
        List<FunctionAuthItem> authList = Arrays.asList(
                new FunctionAuthItem("USER", "-EU"),
                new FunctionAuthItem("USER", null), // 重复 FUNCTION，market=null
                new FunctionAuthItem("RULES", "")); // market 为空字符串

        UD17HDocUserAdministrationRequest request = createRequest(USERID);
        request.setFunctionAuths(authList);

        UD17HDocUserAdministrationResponse response = service.UD17UpdateRole(request);

        assertEquals("200", response.getCode());
        assertEquals("用户权限更新成功", response.getMessage());

        // FUNCTION 去重：USER 只插入一次，RULES 插入一次
        verify(ud17Mapper, times(2)).insertFunctionAuth(any(), any(), any(), any(), any(), any());

        // market 为 null 或空时跳过 insertMarketAuth
        // 只有 USER 的 "-EU" 会插入 market auth
        verify(ud17Mapper, times(1)).insertMarketAuth(any(), any(), any(), any(), any(), any(), any());
        verify(ud17Mapper).insertMarketAuth(eq(USERID), eq("-EU"), eq("U"), any(), any(), any(), any());
    }

    @Test
    @DisplayName("[UpdateRole] function 为 null 且 market 非空时应调用 mapFunctionToTypeCode(null)")
    void testUpdateRole_FunctionNull() {
        when(ud17Mapper.selectUserNameByUserid(USERID)).thenReturn(USER_NAME);

        // function=null, market="-EU" → 会调用 mapFunctionToTypeCode(null) → 返回 null
        List<FunctionAuthItem> authList = Collections.singletonList(
                new FunctionAuthItem(null, "-EU"));

        UD17HDocUserAdministrationRequest request = createRequest(USERID);
        request.setFunctionAuths(authList);

        UD17HDocUserAdministrationResponse response = service.UD17UpdateRole(request);

        assertEquals("200", response.getCode());
        assertEquals("用户权限更新成功", response.getMessage());

        verify(ud17Mapper, times(1)).insertFunctionAuth(any(), any(), any(), any(), any(), any());
        // mapFunctionToTypeCode(null) → null，insertMarketAuth 的 typeCode 参数为 null
        verify(ud17Mapper, times(1)).insertMarketAuth(eq(USERID), eq("-EU"), isNull(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("[UpdateRole] 系统异常时应返回500")
    void testUpdateRole_Exception() {
        when(ud17Mapper.selectUserNameByUserid(anyString()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD17HDocUserAdministrationResponse response = service.UD17UpdateRole(createRequest(USERID));

        assertEquals("500", response.getCode());
        assertFalse(response.getSuccess());
        assertEquals("系统繁忙，请稍后重试", response.getMessage());
        verify(ud17Mapper, times(1)).selectUserNameByUserid(USERID);
    }

    // ====================================================================
    // UD17DeleteRole 测试
    // ====================================================================

    @Test
    @DisplayName("[DeleteRole] userid 为 null 时应返回400")
    void testDeleteRole_UseridNull() {
        UD17HDocUserAdministrationResponse response = service.UD17DeleteRole(new UD17HDocUserAdministrationRequest());
        assertEquals("400", response.getCode());
        assertEquals("用户ID不能为空", response.getMessage());
    }

    @Test
    @DisplayName("[DeleteRole] userid 为空字符串时应返回400")
    void testDeleteRole_UseridEmpty() {
        UD17HDocUserAdministrationRequest request = new UD17HDocUserAdministrationRequest();
        request.setUserid("");
        UD17HDocUserAdministrationResponse response = service.UD17DeleteRole(request);
        assertEquals("400", response.getCode());
        assertEquals("用户ID不能为空", response.getMessage());
    }

    @Test
    @DisplayName("[DeleteRole] 用户不存在时应返回404")
    void testDeleteRole_UserNotFound() {
        when(ud17Mapper.selectUserNameByUserid(USERID)).thenReturn(null);

        UD17HDocUserAdministrationResponse response = service.UD17DeleteRole(createRequest(USERID));

        assertEquals("404", response.getCode());
        assertEquals("用户不存在", response.getMessage());
        verify(ud17Mapper, times(1)).selectUserNameByUserid(USERID);
        verify(ud17Mapper, never()).deleteUserFunctionAuth(any());
        verify(ud17Mapper, never()).deleteUserMarketAuth(any());
    }

    @Test
    @DisplayName("[DeleteRole] 删除成功时应返回200")
    void testDeleteRole_Success() {
        when(ud17Mapper.selectUserNameByUserid(USERID)).thenReturn(USER_NAME);

        UD17HDocUserAdministrationResponse response = service.UD17DeleteRole(createRequest(USERID));

        assertEquals("200", response.getCode());
        assertTrue(response.getSuccess());
        assertEquals("用户权限删除成功", response.getMessage());
        verify(ud17Mapper, times(1)).selectUserNameByUserid(USERID);
        verify(ud17Mapper, times(1)).deleteUserFunctionAuth(USERID);
        verify(ud17Mapper, times(1)).deleteUserMarketAuth(USERID);
    }

    @Test
    @DisplayName("[DeleteRole] 系统异常时应返回500")
    void testDeleteRole_Exception() {
        when(ud17Mapper.selectUserNameByUserid(anyString()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD17HDocUserAdministrationResponse response = service.UD17DeleteRole(createRequest(USERID));

        assertEquals("500", response.getCode());
        assertFalse(response.getSuccess());
        assertEquals("系统繁忙，请稍后重试", response.getMessage());
        verify(ud17Mapper, times(1)).selectUserNameByUserid(USERID);
    }

    // ==================== 辅助方法 ====================

    private UD17HDocUserAdministrationRequest createRequest(String userid) {
        UD17HDocUserAdministrationRequest request = new UD17HDocUserAdministrationRequest();
        request.setUserid(userid);
        return request;
    }
}
