package com.web.app.test;

import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.entity.User;
import com.web.app.mapper.UserMapper;
import com.web.app.service.impl.LoginServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * LoginServiceImpl 单元测试
 * 覆盖所有分支：null校验、empty校验、用户不存在、密码错误、登录成功
 * 分支覆盖率达到 100%
 */
@ExtendWith(MockitoExtension.class)
class LoginServiceImplTest {

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private LoginServiceImpl loginService;

    private LoginRequest request;

    @BeforeEach
    void setUp() {
        request = new LoginRequest();
    }

    // =========================================================
    // 分支1: userId == null || userId.trim().isEmpty()
    // 预期: code=400, msg="用户ID不能为空", Mapper从未被调用
    // =========================================================

    @Test
    @DisplayName("userId为null → 返回400")
    void userIdNull_returns400() {
        request.setUserId(null);
        request.setPassword("anyPassword");

        LoginResponse response = loginService.login(request);

        assertEquals(400, response.getCode());
        assertEquals("用户ID不能为空", response.getMsg());
        assertNull(response.getData());
        verifyNoInteractions(userMapper);
    }

    @Test
    @DisplayName("userId为空字符串\"\" → 返回400")
    void userIdEmpty_returns400() {
        request.setUserId("");
        request.setPassword("anyPassword");

        LoginResponse response = loginService.login(request);

        assertEquals(400, response.getCode());
        assertEquals("用户ID不能为空", response.getMsg());
        assertNull(response.getData());
        verifyNoInteractions(userMapper);
    }

    @Test
    @DisplayName("userId为纯空格\"   \" → 返回400")
    void userIdBlank_returns400() {
        request.setUserId("   ");
        request.setPassword("anyPassword");

        LoginResponse response = loginService.login(request);

        assertEquals(400, response.getCode());
        assertEquals("用户ID不能为空", response.getMsg());
        assertNull(response.getData());
        verifyNoInteractions(userMapper);
    }

    // =========================================================
    // 分支2: user == null (userMapper.selectByCondition返回null)
    //   - 分支2a: 有密码(password != null && !isEmpty)
    //     - 分支2a-1: userExists == null → 404 "账号不存在"
    //     - 分支2a-2: userExists != null → 401 "密码不正确"
    //   - 分支2b: 无密码(password == null || isEmpty) → 404 "用户不存在"
    // =========================================================

    @Test
    @DisplayName("有密码 + userExists为null → 404 账号不存在")
    void withPassword_userNotExists_returns404_accountNotExists() {
        String userId = "nonexistentUser";
        String password = "somePassword";
        request.setUserId(userId);
        request.setPassword(password);

        when(userMapper.selectByCondition(userId, password)).thenReturn(null);
        when(userMapper.selectByUserId(userId)).thenReturn(null);

        LoginResponse response = loginService.login(request);

        assertEquals(404, response.getCode());
        assertEquals("账号不存在", response.getMsg());
        assertNull(response.getData());
        verify(userMapper).selectByCondition(userId, password);
        verify(userMapper).selectByUserId(userId);
    }

    @Test
    @DisplayName("有密码 + userExists不为null → 401 密码不正确")
    void withPassword_userExists_returns401_wrongPassword() {
        String userId = "existingUser";
        String password = "wrongPassword";
        request.setUserId(userId);
        request.setPassword(password);

        User existingUser = new User();
        existingUser.setUserid(userId);
        existingUser.setUsername("Real User");

        when(userMapper.selectByCondition(userId, password)).thenReturn(null);
        when(userMapper.selectByUserId(userId)).thenReturn(existingUser);

        LoginResponse response = loginService.login(request);

        assertEquals(401, response.getCode());
        assertEquals("密码不正确", response.getMsg());
        assertNull(response.getData());
        verify(userMapper).selectByCondition(userId, password);
        verify(userMapper).selectByUserId(userId);
    }

    @Test
    @DisplayName("password为null → 404 用户不存在")
    void passwordNull_returns404_userNotExists() {
        String userId = "someUser";
        request.setUserId(userId);
        request.setPassword(null);

        when(userMapper.selectByCondition(userId, null)).thenReturn(null);

        LoginResponse response = loginService.login(request);

        assertEquals(404, response.getCode());
        assertEquals("用户不存在", response.getMsg());
        assertNull(response.getData());
        verify(userMapper).selectByCondition(userId, null);
        verify(userMapper, never()).selectByUserId(anyString());
    }

    @Test
    @DisplayName("password为空字符串\"\" → 404 用户不存在")
    void passwordEmpty_returns404_userNotExists() {
        String userId = "someUser";
        request.setUserId(userId);
        request.setPassword("");

        when(userMapper.selectByCondition(userId, "")).thenReturn(null);

        LoginResponse response = loginService.login(request);

        assertEquals(404, response.getCode());
        assertEquals("用户不存在", response.getMsg());
        assertNull(response.getData());
        verify(userMapper).selectByCondition(userId, "");
        verify(userMapper, never()).selectByUserId(anyString());
    }

    // =========================================================
    // 分支3: user != null → 登录成功
    // 预期: code=200, msg="登录成功", data=user
    // =========================================================

    @Test
    @DisplayName("用户名密码正确 → 返回200及用户数据")
    void validCredentials_returns200() {
        String userId = "validUser";
        String password = "correctPassword";
        request.setUserId(userId);
        request.setPassword(password);

        User user = new User();
        user.setUserid(userId);
        user.setUsername("Valid User");
        user.setPassword(password);
        user.setResponsible("负责人");
        user.setUserPosition("Manager");
        user.setEmail("valid@example.com");

        when(userMapper.selectByCondition(userId, password)).thenReturn(user);

        LoginResponse response = loginService.login(request);

        assertEquals(200, response.getCode());
        assertEquals("登录成功", response.getMsg());
        assertNotNull(response.getData());
        assertSame(user, response.getData());
        verify(userMapper).selectByCondition(userId, password);
        verify(userMapper, never()).selectByUserId(anyString());
    }
}
