package com.web.app.test;

import com.web.app.domain.Entity.UserInfo;
import com.web.app.mapper.UserInfoMapper;
import com.web.app.service.impl.UserInfoServiceImpl;
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
 * UserInfoServiceImpl 单元测试
 * 覆盖所有分支路径，达到100%分支覆盖率
 */
@ExtendWith(MockitoExtension.class)
class UserInfoServiceImplTest {

    @Mock
    private UserInfoMapper userInfoMapper;

    @InjectMocks
    private UserInfoServiceImpl userInfoService;

    private UserInfo mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new UserInfo();
        mockUser.setUserId("testuser");
        mockUser.setPassword("pass123");
        mockUser.setUsername("测试用户");
    }

    // ========================
    // login() 方法测试
    // ========================

    @Test
    @DisplayName("login - 用户存在且密码正确，应返回用户对象")
    void login_UserExistsAndPasswordCorrect_ShouldReturnUser() {
        // 准备
        when(userInfoMapper.selectUserById("testuser")).thenReturn(mockUser);

        // 执行
        UserInfo result = userInfoService.login("testuser", "pass123");

        // 验证
        assertNotNull(result);
        assertEquals("testuser", result.getUserId());
        assertEquals("测试用户", result.getUsername());
        verify(userInfoMapper, times(1)).selectUserById("testuser");
    }

    @Test
    @DisplayName("login - 用户不存在（mapper返回null），应返回null")
    void login_UserNotExists_ShouldReturnNull() {
        // 准备
        when(userInfoMapper.selectUserById("unknown")).thenReturn(null);

        // 执行
        UserInfo result = userInfoService.login("unknown", "pass123");

        // 验证
        assertNull(result);
        verify(userInfoMapper, times(1)).selectUserById("unknown");
    }

    @Test
    @DisplayName("login - 用户存在但密码为null，应返回null")
    void login_PasswordIsNull_ShouldReturnNull() {
        // 准备
        when(userInfoMapper.selectUserById("testuser")).thenReturn(mockUser);

        // 执行
        UserInfo result = userInfoService.login("testuser", null);

        // 验证
        assertNull(result);
        verify(userInfoMapper, times(1)).selectUserById("testuser");
    }

    @Test
    @DisplayName("login - 用户存在但密码错误，应返回null")
    void login_PasswordIncorrect_ShouldReturnNull() {
        // 准备
        when(userInfoMapper.selectUserById("testuser")).thenReturn(mockUser);

        // 执行
        UserInfo result = userInfoService.login("testuser", "wrongpass");

        // 验证
        assertNull(result);
        verify(userInfoMapper, times(1)).selectUserById("testuser");
    }

    // ========================
    // getUserById() 方法测试
    // ========================

    @Test
    @DisplayName("getUserById - 用户存在，应返回用户对象")
    void getUserById_UserExists_ShouldReturnUser() {
        // 准备
        when(userInfoMapper.selectUserById("testuser")).thenReturn(mockUser);

        // 执行
        UserInfo result = userInfoService.getUserById("testuser");

        // 验证
        assertNotNull(result);
        assertEquals("testuser", result.getUserId());
        assertEquals("测试用户", result.getUsername());
        verify(userInfoMapper, times(1)).selectUserById("testuser");
    }

    @Test
    @DisplayName("getUserById - 用户不存在，应返回null")
    void getUserById_UserNotExists_ShouldReturnNull() {
        // 准备
        when(userInfoMapper.selectUserById("nonexistent")).thenReturn(null);

        // 执行
        UserInfo result = userInfoService.getUserById("nonexistent");

        // 验证
        assertNull(result);
        verify(userInfoMapper, times(1)).selectUserById("nonexistent");
    }
}
