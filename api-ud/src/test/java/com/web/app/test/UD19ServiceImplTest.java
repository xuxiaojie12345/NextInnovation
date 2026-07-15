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

    @Test void shouldSearchHdocWithResults() {
        List<Map<String, Object>> rawList = new ArrayList<>();
        Map<String, Object> row = new HashMap<>();
        row.put("USERID", "user1");
        row.put("USERNAME", "User One");
        row.put("MARKET", "JP");
        rawList.add(row);
        when(mapper.searchHdoc(anyString(), anyString(), anyString(), anyString())).thenReturn(rawList);

        List<Map<String, Object>> result = service.searchHdoc("user1", "user", "JP", "R");

        assertEquals(1, result.size());
        assertEquals("user1", result.get(0).get("userid"));
        assertEquals("User One", result.get(0).get("username"));
        assertEquals("JP", result.get(0).get("market"));
    }

    @Test void shouldSearchHdocWithEmptyResults() {
        when(mapper.searchHdoc(anyString(), anyString(), anyString(), anyString())).thenReturn(new ArrayList<>());
        assertTrue(service.searchHdoc("user1", "user", "JP", "R").isEmpty());
    }
}
