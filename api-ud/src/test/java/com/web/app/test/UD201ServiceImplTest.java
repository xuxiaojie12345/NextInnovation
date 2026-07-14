package com.web.app.test;

import com.web.app.mapper.UD201Mapper;
import com.web.app.service.impl.UD201ServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD201ServiceImpl 单元测试
 * updateHdocDocumentList: count==null/0检查 + user/date三元表达式
 */
class UD201ServiceImplTest {

    @Mock
    private UD201Mapper ud201Mapper;

    @InjectMocks
    private UD201ServiceImpl ud201Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("updateHdocDocumentList() - count检查分支")
    class CountCheckTest {

        @Test
        @DisplayName("count为null时返回错误消息")
        void testCountNullReturnsError() {
            when(ud201Mapper.countByDoctype("DOCTYPE1")).thenReturn(null);

            String result = ud201Service.updateHdocDocumentList("DOCTYPE1", new HashMap<>());

            assertEquals("Document type does not exists. Please enter the correct content.", result);
            verify(ud201Mapper, never()).updateHdocDocumentList(anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("count为0时返回错误消息")
        void testCountZeroReturnsError() {
            when(ud201Mapper.countByDoctype("DOCTYPE1")).thenReturn(0);

            String result = ud201Service.updateHdocDocumentList("DOCTYPE1", new HashMap<>());

            assertEquals("Document type does not exists. Please enter the correct content.", result);
            verify(ud201Mapper, never()).updateHdocDocumentList(anyString(), anyString(), anyString());
        }
    }

    @Nested
    @DisplayName("updateHdocDocumentList() - user/date三元分支")
    class UserDateTernaryTest {

        @Test
        @DisplayName("user非空时使用user值作为updateUser")
        void testUserNotEmptyUsesUser() {
            when(ud201Mapper.countByDoctype("DOCTYPE1")).thenReturn(1);

            Map<String, String> request = new HashMap<>();
            request.put("user", "FORM_USER");
            request.put("date", "2024-06-15 10:00:00");
            request.put("updateUser", "LOGIN_USER");

            String result = ud201Service.updateHdocDocumentList("DOCTYPE1", request);

            assertNull(result);
            verify(ud201Mapper, times(1))
                    .updateHdocDocumentList("DOCTYPE1", "FORM_USER", "2024-06-15 10:00:00");
        }

        @Test
        @DisplayName("user为空时使用updateUser作为updateUser")
        void testUserEmptyUsesUpdateUser() {
            when(ud201Mapper.countByDoctype("DOCTYPE1")).thenReturn(1);

            Map<String, String> request = new HashMap<>();
            request.put("user", "");
            request.put("date", "2024-06-15 10:00:00");
            request.put("updateUser", "LOGIN_USER");

            String result = ud201Service.updateHdocDocumentList("DOCTYPE1", request);

            assertNull(result);
            verify(ud201Mapper, times(1))
                    .updateHdocDocumentList("DOCTYPE1", "LOGIN_USER", "2024-06-15 10:00:00");
        }

        @Test
        @DisplayName("date为空时使用当前时间")
        void testDateEmptyUsesNow() {
            when(ud201Mapper.countByDoctype("DOCTYPE1")).thenReturn(1);

            Map<String, String> request = new HashMap<>();
            request.put("user", "FORM_USER");
            request.put("date", "");
            request.put("updateUser", "LOGIN_USER");

            String result = ud201Service.updateHdocDocumentList("DOCTYPE1", request);

            assertNull(result);
            // 验证updateHdocDocumentList被调用但第二个参数是"FORM_USER"
            verify(ud201Mapper, times(1))
                    .updateHdocDocumentList(eq("DOCTYPE1"), eq("FORM_USER"), anyString());
        }

        @Test
        @DisplayName("user和date字段不在request中时使用默认值")
        void testMissingKeysUseDefaults() {
            when(ud201Mapper.countByDoctype("DOCTYPE1")).thenReturn(1);

            Map<String, String> request = new HashMap<>();

            String result = ud201Service.updateHdocDocumentList("DOCTYPE1", request);

            assertNull(result);
            verify(ud201Mapper, times(1))
                    .updateHdocDocumentList(eq("DOCTYPE1"), eq(""), anyString());
        }
    }
}
