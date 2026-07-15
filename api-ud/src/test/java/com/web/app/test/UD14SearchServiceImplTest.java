package com.web.app.test;

import com.web.app.mapper.UD14SearchMapper;
import com.web.app.service.impl.UD14SearchServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UD14SearchServiceImpl Unit Tests")
class UD14SearchServiceImplTest {

    @Mock private UD14SearchMapper mapper;
    @InjectMocks private UD14SearchServiceImpl service;

    @Test void shouldSelectAllMarkets() {
        when(mapper.selectAllMarketCodes()).thenReturn(Arrays.asList("JP", "US"));
        assertEquals(2, service.selectAllMarkets().size());
    }

    @Test void shouldSelectVariablesByMarketAndFile() {
        when(mapper.selectVariablesByVal("JP/file.csv")).thenReturn(Arrays.asList("VAR1", "VAR2"));
        assertEquals(2, service.selectVariablesByMarketAndFile("JP", "file.csv").size());
    }
}
