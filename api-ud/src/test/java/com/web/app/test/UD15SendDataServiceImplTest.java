package com.web.app.test;

import com.web.app.mapper.HDocSendDataVinPlateMapper;
import com.web.app.service.impl.UD15SendDataServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
@DisplayName("UD15SendDataServiceImpl Unit Tests")
class UD15SendDataServiceImplTest {

    @Mock private HDocSendDataVinPlateMapper mapper;
    @InjectMocks private UD15SendDataServiceImpl service;

    @Nested @DisplayName("viewInfo()")
    class ViewInfo {
        @Test void shouldReturnData() {
            Map<String, Object> data = new HashMap<>();
            data.put("serie", "FH");
            when(mapper.selectVinPlateInfo("FH", "12345")).thenReturn(data);
            assertNotNull(service.viewInfo("FH", "12345"));
        }
        @Test void shouldReturnNullWhenNotFound() {
            when(mapper.selectVinPlateInfo(anyString(), anyString())).thenReturn(null);
            assertNull(service.viewInfo("XX", "000"));
        }
    }

    @Test void shouldSetRegenerate() {
        when(mapper.updateStatus(anyString(), anyString(), anyString(), isNull(), anyString(), anyString())).thenReturn(1);
        assertEquals(1, service.setRegenerate("FH", "12345", "user1"));
    }

    @Test void shouldSetOK() {
        when(mapper.updateStatus(anyString(), anyString(), anyString(), isNull(), anyString(), anyString())).thenReturn(1);
        assertEquals(1, service.setOK("FH", "12345", "user1"));
    }

    @Test void shouldChangeToBasicInfo() {
        when(mapper.updateStatusAndType(anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        assertEquals(1, service.changeToBasicInfo("FH", "12345", "user1"));
    }

    @Test void shouldChangeToAdvancedInfo() {
        when(mapper.updateStatusAndType(anyString(), anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        assertEquals(1, service.changeToAdvancedInfo("FH", "12345", "user1"));
    }
}
