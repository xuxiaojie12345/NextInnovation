package com.web.app.test;

import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.entity.UserInfo;
import com.web.app.mapper.UserInfoMapper;
import com.web.app.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserServiceImpl Unit Tests")
class UserServiceImplTest {

    @Mock
    private UserInfoMapper userInfoMapper;

    @InjectMocks
    private UserServiceImpl service;

    private LoginRequest validRequest;
    private UserInfo mockUser;

    @BeforeEach
    void setUp() {
        validRequest = new LoginRequest();
        validRequest.setUserid("testuser");
        validRequest.setPassword("password123");

        mockUser = new UserInfo();
        mockUser.setUserid("testuser");
        mockUser.setUsername("Test User");
        mockUser.setPassword("password123");
    }

    @Nested
    @DisplayName("findByUseridAndPassword()")
    class FindByUseridAndPassword {

        @Test
        @DisplayName("Should return user when credentials are valid")
        void shouldReturnUserWhenValid() {
            when(userInfoMapper.findByUseridAndPassword("testuser", "password123"))
                    .thenReturn(mockUser);

            UserInfo result = service.findByUseridAndPassword("testuser", "password123");

            assertNotNull(result);
            assertEquals("testuser", result.getUserid());
            assertEquals("Test User", result.getUsername());
        }

        @Test
        @DisplayName("Should return null when user not found")
        void shouldReturnNullWhenNotFound() {
            when(userInfoMapper.findByUseridAndPassword(anyString(), anyString()))
                    .thenReturn(null);

            UserInfo result = service.findByUseridAndPassword("unknown", "wrong");

            assertNull(result);
        }
    }

    @Nested
    @DisplayName("authenticate()")
    class Authenticate {

        @Test
        @DisplayName("Should return LoginData when authentication succeeds")
        void shouldReturnLoginDataWhenSuccess() {
            when(userInfoMapper.findByUseridAndPassword("testuser", "password123"))
                    .thenReturn(mockUser);

            LoginResponse.LoginData result = service.authenticate(validRequest);

            assertNotNull(result);
            assertEquals("testuser", result.getUserid());
            assertEquals("Test User", result.getUsername());
            assertNotNull(result.getToken());
            assertTrue(result.getToken().startsWith("mock-token-"));
        }

        @Test
        @DisplayName("Should return null when authentication fails")
        void shouldReturnNullWhenFails() {
            when(userInfoMapper.findByUseridAndPassword(anyString(), anyString()))
                    .thenReturn(null);

            LoginResponse.LoginData result = service.authenticate(validRequest);

            assertNull(result);
        }
    }
}
