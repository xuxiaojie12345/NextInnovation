package com.web.app.test;

import com.web.app.domain.AuthenticationRequest;
import com.web.app.domain.AuthenticationResponse;
import com.web.app.domain.entity.UserInfo;
import com.web.app.mapper.UserInfoMapper;
import com.web.app.service.impl.UD01ServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD01ServiceImpl 单元测试
 *
 * 覆盖 authenticate 方法的全部分支：
 * - request == null
 * - request.username == null
 * - request.password == null
 * - 用户存在（认证成功）
 * - 用户不存在（认证失败）
 */
class UD01ServiceImplTest {

    @Mock
    private UserInfoMapper userInfoMapper;

    @InjectMocks
    private UD01ServiceImpl ud01Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("参数校验 - 应返回 400")
    class ParameterValidation {

        @Test
        @DisplayName("request 为 null 时，应返回 code=400，success=false")
        void authenticate_withNullRequest_shouldReturn400() {
            // Act
            AuthenticationResponse response = ud01Service.authenticate(null);

            // Assert
            assertAll(
                    () -> assertEquals(400, response.getCode()),
                    () -> assertEquals("Username and password are required.", response.getMessage()),
                    () -> assertNotNull(response.getData()),
                    () -> assertFalse(response.getData().getSuccess()),
                    () -> assertNull(response.getData().getUserInfo())
            );
            // 确保未调用 Mapper
            verifyNoInteractions(userInfoMapper);
        }

        @Test
        @DisplayName("username 为 null 时，应返回 code=400，success=false")
        void authenticate_withNullUsername_shouldReturn400() {
            // Arrange
            AuthenticationRequest request = new AuthenticationRequest();
            request.setUsername(null);
            request.setPassword("password123");

            // Act
            AuthenticationResponse response = ud01Service.authenticate(request);

            // Assert
            assertAll(
                    () -> assertEquals(400, response.getCode()),
                    () -> assertEquals("Username and password are required.", response.getMessage()),
                    () -> assertNotNull(response.getData()),
                    () -> assertFalse(response.getData().getSuccess()),
                    () -> assertNull(response.getData().getUserInfo())
            );
            // 确保未调用 Mapper
            verifyNoInteractions(userInfoMapper);
        }

        @Test
        @DisplayName("password 为 null 时，应返回 code=400，success=false")
        void authenticate_withNullPassword_shouldReturn400() {
            // Arrange
            AuthenticationRequest request = new AuthenticationRequest();
            request.setUsername("testuser");
            request.setPassword(null);

            // Act
            AuthenticationResponse response = ud01Service.authenticate(request);

            // Assert
            assertAll(
                    () -> assertEquals(400, response.getCode()),
                    () -> assertEquals("Username and password are required.", response.getMessage()),
                    () -> assertNotNull(response.getData()),
                    () -> assertFalse(response.getData().getSuccess()),
                    () -> assertNull(response.getData().getUserInfo())
            );
            // 确保未调用 Mapper
            verifyNoInteractions(userInfoMapper);
        }

        @Test
        @DisplayName("username 和 password 均为 null 时，应返回 code=400，success=false")
        void authenticate_withBothNull_shouldReturn400() {
            // Arrange
            AuthenticationRequest request = new AuthenticationRequest();
            request.setUsername(null);
            request.setPassword(null);

            // Act
            AuthenticationResponse response = ud01Service.authenticate(request);

            // Assert
            assertAll(
                    () -> assertEquals(400, response.getCode()),
                    () -> assertEquals("Username and password are required.", response.getMessage()),
                    () -> assertNotNull(response.getData()),
                    () -> assertFalse(response.getData().getSuccess())
            );
            verifyNoInteractions(userInfoMapper);
        }
    }

    @Nested
    @DisplayName("认证成功 - 应返回 200")
    class AuthenticationSuccess {

        @Test
        @DisplayName("用户名密码匹配时，应返回 code=200，success=true，含用户信息")
        void authenticate_withValidCredentials_shouldReturn200() {
            // Arrange
            AuthenticationRequest request = new AuthenticationRequest();
            request.setUsername("TestUser");
            request.setPassword("password123");

            UserInfo mockUser = new UserInfo();
            mockUser.setUserid("TESTUSER");
            mockUser.setUsername("Test User");
            mockUser.setEmail("test@example.com");
            mockUser.setResponsible("Admin");

            // 模拟 Mapper 返回用户（username 会转为大写后查询）
            when(userInfoMapper.findByUserIdAndPassword("TESTUSER", "password123"))
                    .thenReturn(mockUser);

            // Act
            AuthenticationResponse response = ud01Service.authenticate(request);

            // Assert
            assertAll(
                    () -> assertEquals(200, response.getCode()),
                    () -> assertEquals("Authentication successful.", response.getMessage()),
                    () -> assertNotNull(response.getData()),
                    () -> assertTrue(response.getData().getSuccess()),
                    () -> assertNotNull(response.getData().getUserInfo()),
                    () -> assertEquals("TESTUSER", response.getData().getUserInfo().getUserid()),
                    () -> assertEquals("Test User", response.getData().getUserInfo().getUsername())
            );

            // 验证 Mapper 被正确调用（username 转大写）
            verify(userInfoMapper, times(1))
                    .findByUserIdAndPassword("TESTUSER", "password123");
        }

        @Test
        @DisplayName("用户名小写输入时，应转为大写后认证成功")
        void authenticate_withLowercaseUsername_shouldConvertToUppercase() {
            // Arrange
            AuthenticationRequest request = new AuthenticationRequest();
            request.setUsername("testuser");
            request.setPassword("pass456");

            UserInfo mockUser = new UserInfo();
            mockUser.setUserid("TESTUSER");

            // 断言 Mapper 接收的是大写后的 username
            when(userInfoMapper.findByUserIdAndPassword("TESTUSER", "pass456"))
                    .thenReturn(mockUser);

            // Act
            AuthenticationResponse response = ud01Service.authenticate(request);

            // Assert
            assertAll(
                    () -> assertEquals(200, response.getCode()),
                    () -> assertTrue(response.getData().getSuccess())
            );
            verify(userInfoMapper, times(1))
                    .findByUserIdAndPassword("TESTUSER", "pass456");
        }

        @Test
        @DisplayName("用户名带前后空格时，应 trim 后转大写再认证")
        void authenticate_withUsernameHavingSpaces_shouldTrimAndUppercase() {
            // Arrange
            AuthenticationRequest request = new AuthenticationRequest();
            request.setUsername("  TestUser  ");
            request.setPassword("pass789");

            UserInfo mockUser = new UserInfo();
            mockUser.setUserid("TESTUSER");

            when(userInfoMapper.findByUserIdAndPassword("TESTUSER", "pass789"))
                    .thenReturn(mockUser);

            // Act
            AuthenticationResponse response = ud01Service.authenticate(request);

            // Assert
            assertAll(
                    () -> assertEquals(200, response.getCode()),
                    () -> assertTrue(response.getData().getSuccess())
            );
            verify(userInfoMapper, times(1))
                    .findByUserIdAndPassword("TESTUSER", "pass789");
        }
    }

    @Nested
    @DisplayName("认证失败 - 应返回 401")
    class AuthenticationFailure {

        @Test
        @DisplayName("用户名密码不匹配时，应返回 code=401，success=false")
        void authenticate_withInvalidCredentials_shouldReturn401() {
            // Arrange
            AuthenticationRequest request = new AuthenticationRequest();
            request.setUsername("wronguser");
            request.setPassword("wrongpass");

            // 模拟 Mapper 返回 null（用户不存在）
            when(userInfoMapper.findByUserIdAndPassword("WRONGUSER", "wrongpass"))
                    .thenReturn(null);

            // Act
            AuthenticationResponse response = ud01Service.authenticate(request);

            // Assert
            assertAll(
                    () -> assertEquals(401, response.getCode()),
                    () -> assertEquals("We didn't recognize the username or password you entered. Please try again.",
                            response.getMessage()),
                    () -> assertNotNull(response.getData()),
                    () -> assertFalse(response.getData().getSuccess()),
                    () -> assertNull(response.getData().getUserInfo())
            );

            verify(userInfoMapper, times(1))
                    .findByUserIdAndPassword("WRONGUSER", "wrongpass");
        }

        @Test
        @DisplayName("用户名密码均为空字符串时，应查询数据库并返回 401")
        void authenticate_withEmptyCredentials_shouldQueryDbAndReturn401() {
            // Arrange
            AuthenticationRequest request = new AuthenticationRequest();
            request.setUsername("");
            request.setPassword("");

            // 空字符串 trim 后也是空，转大写后仍为空，查询返回 null
            when(userInfoMapper.findByUserIdAndPassword("", ""))
                    .thenReturn(null);

            // Act
            AuthenticationResponse response = ud01Service.authenticate(request);

            // Assert
            assertAll(
                    () -> assertEquals(401, response.getCode()),
                    () -> assertFalse(response.getData().getSuccess())
            );

            verify(userInfoMapper, times(1))
                    .findByUserIdAndPassword("", "");
        }
    }
}
