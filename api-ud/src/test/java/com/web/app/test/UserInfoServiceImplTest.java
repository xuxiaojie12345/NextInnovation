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
 *
 * 覆盖所有分支（100%覆盖率）:
 *
 * login 方法分支:
 * 1. user == null -> return null
 * 2. user != null && password 匹配 -> return user
 * 3. user != null && password 不匹配 -> return null
 *
 * getUserById 方法分支:
 * 4. user 存在 -> return user
 * 5. user 不存在 (mapper返回null) -> return null
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserInfoServiceImpl 单元测试")
class UserInfoServiceImplTest {

    @Mock
    private UserInfoMapper userInfoMapper;

    @InjectMocks
    private UserInfoServiceImpl userInfoService;

    private static final String TEST_USER_ID = "test_admin";
    private static final String TEST_PASSWORD = "Test@123";
    private static final String WRONG_PASSWORD = "WrongPassword";

    private UserInfo mockUser;

    @BeforeEach
    void setUp() {
        reset(userInfoMapper);

        // 构建测试用户
        mockUser = new UserInfo();
        mockUser.setUserId(TEST_USER_ID);
        mockUser.setPassword(TEST_PASSWORD);
        mockUser.setUsername("Test Admin");
        mockUser.setResponsible("Admin");
        mockUser.setUserposition("Manager");
        mockUser.setEMmail("admin@test.com");
    }

    // ============================================================
    // login 方法测试
    // ============================================================

    /**
     * 测试 login - 用户存在且密码正确
     * 覆盖: user != null && user.getPassword().equals(password) -> return user
     */
    @Test
    @DisplayName("login-用户存在且密码正确-返回UserInfo")
    void testLogin_UserExistsAndPasswordMatches() {
        // Arrange
        when(userInfoMapper.selectUserById(TEST_USER_ID)).thenReturn(mockUser);

        // Act
        UserInfo result = userInfoService.login(TEST_USER_ID, TEST_PASSWORD);

        // Assert
        assertNotNull(result, "登录成功时应返回UserInfo对象");
        assertEquals(TEST_USER_ID, result.getUserId(), "用户ID应匹配");
        assertEquals(TEST_PASSWORD, result.getPassword(), "密码应匹配");
        assertEquals("Test Admin", result.getUsername(), "用户名应匹配");

        // 验证Mapper被调用一次
        verify(userInfoMapper, times(1)).selectUserById(TEST_USER_ID);
    }

    /**
     * 测试 login - 用户存在但密码错误
     * 覆盖: user != null && user.getPassword().equals(password) -> false -> return null
     */
    @Test
    @DisplayName("login-用户存在但密码错误-返回null")
    void testLogin_UserExistsButWrongPassword() {
        // Arrange
        when(userInfoMapper.selectUserById(TEST_USER_ID)).thenReturn(mockUser);

        // Act
        UserInfo result = userInfoService.login(TEST_USER_ID, WRONG_PASSWORD);

        // Assert
        assertNull(result, "密码错误时应返回null");

        // 验证Mapper被调用一次
        verify(userInfoMapper, times(1)).selectUserById(TEST_USER_ID);
    }

    /**
     * 测试 login - 用户不存在（Mapper返回null）
     * 覆盖: user == null -> return null
     */
    @Test
    @DisplayName("login-用户不存在-Mapper返回null-返回null")
    void testLogin_UserNotFound() {
        // Arrange
        when(userInfoMapper.selectUserById(TEST_USER_ID)).thenReturn(null);

        // Act
        UserInfo result = userInfoService.login(TEST_USER_ID, TEST_PASSWORD);

        // Assert
        assertNull(result, "用户不存在时应返回null");

        // 验证Mapper被调用一次
        verify(userInfoMapper, times(1)).selectUserById(TEST_USER_ID);
    }

    /**
     * 测试 login - 用户ID为空字符串
     * 覆盖: mapper 使用空字符串参数调用 -> mapper返回null -> return null
     */
    @Test
    @DisplayName("login-用户ID为空字符串-返回null")
    void testLogin_EmptyUserId() {
        // Arrange
        when(userInfoMapper.selectUserById("")).thenReturn(null);

        // Act
        UserInfo result = userInfoService.login("", TEST_PASSWORD);

        // Assert
        assertNull(result, "用户ID为空时应返回null");

        // 验证Mapper被调用一次（空字符串传递给Mapper）
        verify(userInfoMapper, times(1)).selectUserById("");
    }

    // ============================================================
    // getUserById 方法测试
    // ============================================================

    /**
     * 测试 getUserById - 用户存在
     * 覆盖: mapper返回UserInfo -> return user
     */
    @Test
    @DisplayName("getUserById-用户存在-返回UserInfo")
    void testGetUserById_UserExists() {
        // Arrange
        when(userInfoMapper.selectUserById(TEST_USER_ID)).thenReturn(mockUser);

        // Act
        UserInfo result = userInfoService.getUserById(TEST_USER_ID);

        // Assert
        assertNotNull(result, "用户存在时应返回UserInfo对象");
        assertEquals(TEST_USER_ID, result.getUserId(), "用户ID应匹配");
        assertEquals(TEST_PASSWORD, result.getPassword(), "密码应匹配");

        // 验证Mapper被调用一次
        verify(userInfoMapper, times(1)).selectUserById(TEST_USER_ID);
    }

    /**
     * 测试 getUserById - 用户不存在（Mapper返回null）
     * 覆盖: mapper返回null -> return null
     */
    @Test
    @DisplayName("getUserById-用户不存在-Mapper返回null-返回null")
    void testGetUserById_UserNotFound() {
        // Arrange
        when(userInfoMapper.selectUserById(TEST_USER_ID)).thenReturn(null);

        // Act
        UserInfo result = userInfoService.getUserById(TEST_USER_ID);

        // Assert
        assertNull(result, "用户不存在时应返回null");

        // 验证Mapper被调用一次
        verify(userInfoMapper, times(1)).selectUserById(TEST_USER_ID);
    }

    /**
     * 测试 getUserById - 用户ID为null
     * 覆盖: mapper使用null参数调用 -> mapper返回null -> return null
     */
    @Test
    @DisplayName("getUserById-用户ID为null-返回null")
    void testGetUserById_NullUserId() {
        // Arrange
        when(userInfoMapper.selectUserById(null)).thenReturn(null);

        // Act
        UserInfo result = userInfoService.getUserById(null);

        // Assert
        assertNull(result, "用户ID为null时应返回null");

        // 验证Mapper被调用一次（null参数传递给Mapper）
        verify(userInfoMapper, times(1)).selectUserById(null);
    }
}
