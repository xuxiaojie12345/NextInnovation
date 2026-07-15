package com.web.app.test;

import com.web.app.entity.MarketMaster;
import com.web.app.mapper.MarketMasterMapper;
import com.web.app.service.impl.MarketMasterServiceImpl;
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
@DisplayName("MarketMasterServiceImpl Unit Tests")
class MarketMasterServiceImplTest {

    @Mock private MarketMasterMapper mapper;
    @InjectMocks private MarketMasterServiceImpl service;

    @Test void shouldSelectAllMarkets() {
        when(mapper.selectAllMarkets()).thenReturn(Arrays.asList(new MarketMaster()));
        assertEquals(1, service.selectAllMarkets().size());
    }
}
