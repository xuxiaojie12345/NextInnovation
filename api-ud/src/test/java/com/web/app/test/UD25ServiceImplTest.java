package com.web.app.test;

import com.web.app.domain.UD25UserInfoResponse;
import com.web.app.domain.entity.UserInfo;
import com.web.app.mapper.UserInfoMapper;
import com.web.app.service.impl.UD25ServiceImpl;
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
 * UD25ServiceImpl 单元测试
 * getUserInfo: userInfo==null→返回null
 */
class UD25ServiceImplTest {

    @Mock
    private UserInfoMapper userInfoMapper;

    @InjectMocks
    private UD25ServiceImpl ud25Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("getUserInfo() - 用户不存在")
    class UserNotFoundTest {

        @Test
        @DisplayName("Mapper返回null时返回null")
        void testUserInfoNullReturnsNull() {
            when(userInfoMapper.findByUserId("NONEXIST")).thenReturn(null);

            UD25UserInfoResponse result = ud25Service.getUserInfo("NONEXIST");

            assertNull(result);
            verify(userInfoMapper, times(1)).findByUserId("NONEXIST");
        }
    }

    @Nested
    @DisplayName("getUserInfo() - 用户存在")
    class UserFoundTest {

        @Test
        @DisplayName("正常返回映射后的用户信息")
        void testUserInfoFoundReturnsMappedResponse() {
            UserInfo userInfo = new UserInfo();
            userInfo.setUserid("USER001");
            userInfo.setResponsible("John Doe");
            userInfo.setUserposition("Manager");
            userInfo.setEmail("john@example.com");

            when(userInfoMapper.findByUserId("USER001")).thenReturn(userInfo);

            UD25UserInfoResponse result = ud25Service.getUserInfo("USER001");

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertEquals("USER001", result.getUserid()),
                    () -> assertEquals("John Doe", result.getResponsible()),
                    () -> assertEquals("Manager", result.getUserPosition()),
                    () -> assertEquals("john@example.com", result.getEmail())
            );
            verify(userInfoMapper, times(1)).findByUserId("USER001");
        }

        @Test
        @DisplayName("用户字段为null时映射后也为null")
        void testUserInfoWithNullFields() {
            UserInfo userInfo = new UserInfo();
            userInfo.setUserid("USER002");
            userInfo.setResponsible(null);
            userInfo.setUserposition(null);
            userInfo.setEmail(null);

            when(userInfoMapper.findByUserId("USER002")).thenReturn(userInfo);

            UD25UserInfoResponse result = ud25Service.getUserInfo("USER002");

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertEquals("USER002", result.getUserid()),
                    () -> assertNull(result.getResponsible()),
                    () -> assertNull(result.getUserPosition()),
                    () -> assertNull(result.getEmail())
            );
        }
    }
}
