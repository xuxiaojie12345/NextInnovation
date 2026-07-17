package com.web.app.test;

import com.web.app.dto.AuthenticationRequest;
import com.web.app.dto.AuthenticationResponse;
import com.web.app.entity.HdocUserInfor;
import com.web.app.mapper.HdocUserInforMapper;
import com.web.app.service.impl.AuthenticationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * AuthenticationServiceImpl 的单元测试
 * 覆盖所有分支以达到 100% 的 JaCoCo 覆盖率
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthenticationServiceImpl 单元测试")
class AuthenticationServiceImplTest {

    @Mock
    private HdocUserInforMapper hdocUserInforMapper;

    @InjectMocks
    private AuthenticationServiceImpl authenticationService;

    private HdocUserInfor mockUser;

    @BeforeEach
    void setUp() {
        // 准备模拟用户数据
        mockUser = new HdocUserInfor();
        mockUser.setUserid("testuser");
        mockUser.setPassword("password123");
        mockUser.setUsername("测试用户");
        mockUser.setResponsible("负责人");
        mockUser.setUserposition("职位");
        mockUser.setEmail("test@example.com");
    }

    // ==================== 分支1: 用户不存在 (user == null) ====================

    @Test
    @DisplayName("用户不存在时应返回401")
    void testAuthentication_UserNotFound() {
        // 准备：模拟 Mapper 返回 null
        when(hdocUserInforMapper.selectByUserId(anyString(), any()))
                .thenReturn(null);

        // 执行
        AuthenticationRequest request = new AuthenticationRequest("nonexistent", "anyPassword");
        AuthenticationResponse response = authenticationService.authentication(request);

        // 验证
        assertEquals(401, response.getCode());
        assertEquals("We didn't recognize the username or password you entered. Please try again.",
                response.getMsg());
        assertNull(response.getData());
        verify(hdocUserInforMapper, times(1)).selectByUserId("nonexistent", null);
    }

    // ==================== 分支2: 密码为 null 时 StringUtils.hasText 返回 false
    // ====================

    @Test
    @DisplayName("密码为 null 时跳过密码验证，认证成功")
    void testAuthentication_PasswordNull() {
        // 准备：模拟 Mapper 返回用户，请求密码为 null
        when(hdocUserInforMapper.selectByUserId(anyString(), any()))
                .thenReturn(mockUser);

        // 执行
        AuthenticationRequest request = new AuthenticationRequest("testuser", null);
        AuthenticationResponse response = authenticationService.authentication(request);

        // 验证：应返回成功
        assertEquals(200, response.getCode());
        assertEquals("登录成功", response.getMsg());
        assertNotNull(response.getData());
        assertEquals("testuser", response.getData().getUserId());
        assertEquals("测试用户", response.getData().getUsername());
        assertEquals("负责人", response.getData().getResponsible());
        assertEquals("职位", response.getData().getUserPosition());
        assertEquals("test@example.com", response.getData().getEmail());
        assertEquals("TODO_GENERATE_TOKEN", response.getData().getToken());
        verify(hdocUserInforMapper, times(1)).selectByUserId("testuser", null);
    }

    // ==================== 分支3: 密码为空字符串时 StringUtils.hasText 返回 false
    // ====================

    @Test
    @DisplayName("密码为空字符串时跳过密码验证，认证成功")
    void testAuthentication_PasswordEmpty() {
        // 准备：模拟 Mapper 返回用户，请求密码为空字符串
        when(hdocUserInforMapper.selectByUserId(anyString(), any()))
                .thenReturn(mockUser);

        // 执行
        AuthenticationRequest request = new AuthenticationRequest("testuser", "");
        AuthenticationResponse response = authenticationService.authentication(request);

        // 验证：应返回成功（空密码跳过验证）
        assertEquals(200, response.getCode());
        assertEquals("登录成功", response.getMsg());
        assertNotNull(response.getData());
        assertEquals("testuser", response.getData().getUserId());
        verify(hdocUserInforMapper, times(1)).selectByUserId("testuser", null);
    }

    // ==================== 分支4: 密码不为空但不匹配 ====================

    @Test
    @DisplayName("密码不匹配时应返回401")
    void testAuthentication_PasswordNotMatch() {
        // 准备：模拟 Mapper 返回用户
        when(hdocUserInforMapper.selectByUserId(anyString(), any()))
                .thenReturn(mockUser);

        // 执行：传入错误密码
        AuthenticationRequest request = new AuthenticationRequest("testuser", "wrongPassword");
        AuthenticationResponse response = authenticationService.authentication(request);

        // 验证
        assertEquals(401, response.getCode());
        assertEquals("We didn't recognize the username or password you entered. Please try again.",
                response.getMsg());
        assertNull(response.getData());
        verify(hdocUserInforMapper, times(1)).selectByUserId("testuser", null);
    }

    // ==================== 分支5: 认证成功（密码匹配） ====================

    @Test
    @DisplayName("用户存在且密码匹配时应认证成功")
    void testAuthentication_Success() {
        // 准备：模拟 Mapper 返回用户
        when(hdocUserInforMapper.selectByUserId(anyString(), any()))
                .thenReturn(mockUser);

        // 执行：传入正确密码
        AuthenticationRequest request = new AuthenticationRequest("testuser", "password123");
        AuthenticationResponse response = authenticationService.authentication(request);

        // 验证
        assertEquals(200, response.getCode());
        assertEquals("登录成功", response.getMsg());
        assertNotNull(response.getData());
        assertEquals("testuser", response.getData().getUserId());
        assertEquals("测试用户", response.getData().getUsername());
        assertEquals("负责人", response.getData().getResponsible());
        assertEquals("职位", response.getData().getUserPosition());
        assertEquals("test@example.com", response.getData().getEmail());
        assertEquals("TODO_GENERATE_TOKEN", response.getData().getToken());
        verify(hdocUserInforMapper, times(1)).selectByUserId("testuser", null);
    }

    // ==================== 分支6: 系统异常（catch Exception 分支） ====================

    @Test
    @DisplayName("系统异常时应返回500")
    void testAuthentication_Exception() {
        // 准备：模拟 Mapper 抛出异常
        when(hdocUserInforMapper.selectByUserId(anyString(), any()))
                .thenThrow(new RuntimeException("数据库连接失败"));

        // 执行
        AuthenticationRequest request = new AuthenticationRequest("testuser", "password123");
        AuthenticationResponse response = authenticationService.authentication(request);

        // 验证
        assertEquals(500, response.getCode());
        assertEquals("服务器内部错误", response.getMsg());
        assertNull(response.getData());
        verify(hdocUserInforMapper, times(1)).selectByUserId("testuser", null);
    }
}
