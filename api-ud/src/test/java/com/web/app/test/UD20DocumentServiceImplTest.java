package com.web.app.test;

import com.web.app.mapper.UD20DocumentMapper;
import com.web.app.service.impl.UD20DocumentServiceImpl;
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
@DisplayName("UD20DocumentServiceImpl Unit Tests")
class UD20DocumentServiceImplTest {

    @Mock private UD20DocumentMapper mapper;
    @InjectMocks private UD20DocumentServiceImpl service;

    @Test void shouldGetDocumentList() {
        when(mapper.selectDocumentList(anyMap())).thenReturn(new ArrayList<>());
        assertNotNull(service.getDocumentList(new HashMap<>()));
    }

    @Test void shouldUpdateDocumentList() {
        when(mapper.updateDocumentList(anyMap())).thenReturn(1);
        assertEquals(1, service.updateDocumentList(new HashMap<>()));
    }
}
