package com.web.app.test;

import com.web.app.mapper.SaveModificationsMapper;
import com.web.app.service.impl.SaveModificationsServiceImpl;
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
@DisplayName("SaveModificationsServiceImpl Unit Tests")
class SaveModificationsServiceImplTest {

    @Mock private SaveModificationsMapper mapper;
    @InjectMocks private SaveModificationsServiceImpl service;

    @Test void shouldSelectModificationData() {
        when(mapper.selectModificationData("FH", "12345")).thenReturn(new ArrayList<>());
        assertNotNull(service.selectModificationData("FH", "12345"));
    }
}
