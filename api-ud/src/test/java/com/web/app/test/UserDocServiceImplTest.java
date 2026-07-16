package com.web.app.test;

import com.web.app.mapper.UserDocMapper;
import com.web.app.service.impl.UserDocServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserDocServiceImpl Unit Tests")
class UserDocServiceImplTest {

    @Mock private UserDocMapper userDocMapper;
    @InjectMocks private UserDocServiceImpl service;

    @Test void shouldDeleteUserDoc() {
        when(userDocMapper.deleteUserDoc("user1")).thenReturn(1);
        service.deleteUserDoc("user1");
        verify(userDocMapper).deleteUserDoc("user1");
    }

    @Test void shouldCreateUserDoc() {
        when(userDocMapper.insertUserDoc(anyString(), anyString(), anyString())).thenReturn(1);
        service.createUserDoc("user1", "HDOC", "admin");
        verify(userDocMapper).insertUserDoc("user1", "HDOC", "admin");
    }

    @Test void shouldSelectFunctionAuthCount() {
        when(userDocMapper.selectFunctionAuthCount("user1")).thenReturn(3);
        assertEquals(3, service.selectFunctionAuthCount("user1"));
    }

    @Test void shouldSelectUserDoc() {
        when(userDocMapper.selectUserDoc("user1")).thenReturn(Arrays.asList("HDOC", "OTHER"));
        List<String> result = service.selectUserDoc("user1");
        assertEquals(2, result.size());
    }

    @Test void shouldUpdateUserDoc() {
        when(userDocMapper.deleteUserDoc("user1")).thenReturn(1);
        when(userDocMapper.insertUserDoc(anyString(), anyString(), anyString())).thenReturn(1);
        service.updateUserDoc("user1", Arrays.asList("HDOC", "OTHER"));
        verify(userDocMapper).deleteUserDoc("user1");
        verify(userDocMapper, times(2)).insertUserDoc(anyString(), anyString(), anyString());
    }
}
