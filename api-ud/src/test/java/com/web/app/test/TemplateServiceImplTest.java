package com.web.app.test;

import com.web.app.mapper.MarketMasterMapper;
import com.web.app.service.impl.TemplateServiceImpl;
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
@DisplayName("TemplateServiceImpl Unit Tests")
class TemplateServiceImplTest {

    @Mock private MarketMasterMapper marketMasterMapper;
    @InjectMocks private TemplateServiceImpl service;

    @Test void shouldSelectAllMarkets() {
        when(marketMasterMapper.selectAllMarketCodes()).thenReturn(Arrays.asList("JP"));
        assertEquals(1, service.selectAllMarkets().size());
    }
}
