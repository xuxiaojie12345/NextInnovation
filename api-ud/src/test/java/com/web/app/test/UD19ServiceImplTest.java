package com.web.app.test;

import com.web.app.mapper.UD19Mapper;
import com.web.app.service.impl.UD19ServiceImpl;
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
@DisplayName("UD19ServiceImpl Unit Tests")
class UD19ServiceImplTest {

    @Mock private UD19Mapper mapper;
    @InjectMocks private UD19ServiceImpl service;

    @Test void shouldSelectAllMarkets() {
        when(mapper.selectAllMarketCodes()).thenReturn(Arrays.asList("JP"));
        assertEquals(1, service.selectAllMarkets().size());
    }

    @Test void shouldSearchHdoc() {
        when(mapper.searchHdoc(anyString(), anyString(), anyString(), anyString())).thenReturn(new ArrayList<>());
        assertNotNull(service.searchHdoc("user1", "user", "JP", "R"));
    }
}
