package com.web.app.test;

import com.web.app.service.impl.HdocVariablesServiceImpl;
import com.web.app.mapper.HdocVariablesMapper;
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
@DisplayName("HdocVariablesServiceImpl Unit Tests")
class HdocVariablesServiceImplTest {

    @Mock private HdocVariablesMapper mapper;
    @InjectMocks private HdocVariablesServiceImpl service;

    @Nested @DisplayName("addVariable()")
    class AddVariable {
        @Test void shouldAdd() {
            when(mapper.insertVariable(anyString(), anyString(), anyString(), anyString())).thenReturn(1);
            assertEquals(1, service.addVariable("VAR", "TEXT", "desc", "user1"));
        }
    }

    @Nested @DisplayName("updateVariable()")
    class UpdateVariable {
        @Test void shouldUpdate() {
            when(mapper.updateVariable(anyString(), anyString(), anyString(), anyString())).thenReturn(1);
            assertEquals(1, service.updateVariable("VAR", "TEXT", "desc", "user1"));
        }
    }

    @Nested @DisplayName("deleteVariable()")
    class DeleteVariable {
        @Test void shouldDelete() {
            when(mapper.deleteVariable("VAR")).thenReturn(1);
            assertEquals(1, service.deleteVariable("VAR"));
        }
    }

    @Nested @DisplayName("searchVariables()")
    class SearchVariables {
        @Test void shouldSearch() {
            when(mapper.searchVariables(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(new ArrayList<>());
            assertNotNull(service.searchVariables(null, null, null, null, null, null, null, null, null, null));
        }
    }
}
