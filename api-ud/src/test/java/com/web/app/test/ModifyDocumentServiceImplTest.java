package com.web.app.test;

import com.web.app.mapper.ModifyDocumentMapper;
import com.web.app.service.impl.ModifyDocumentServiceImpl;
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
@DisplayName("ModifyDocumentServiceImpl Unit Tests")
class ModifyDocumentServiceImplTest {

    @Mock private ModifyDocumentMapper mapper;
    @InjectMocks private ModifyDocumentServiceImpl service;

    @Test void shouldSelectModifications() {
        when(mapper.selectModifications("FH", "12345")).thenReturn(new ArrayList<>());
        assertNotNull(service.selectModifications("FH", "12345"));
    }

    @Test void shouldHandleEmptyModifications() {
        assertEquals(0, service.updateModifications("FH", "12345", new ArrayList<>(), "user1"));
    }

    @Test void shouldUpdateModificationWithValue() {
        List<Map<String, String>> mods = new ArrayList<>();
        Map<String, String> mod = new HashMap<>();
        mod.put("variable", "VAR1");
        mod.put("val", "NEW_VAL");
        mods.add(mod);
        when(mapper.updateModificationValue(anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(1);
        assertEquals(1, service.updateModifications("FH", "12345", mods, "user1"));
    }

    @Test void shouldUseSystemUserWhenNull() {
        List<Map<String, String>> mods = new ArrayList<>();
        Map<String, String> mod = new HashMap<>();
        mod.put("variable", "VAR1");
        mod.put("val", "NEW_VAL");
        mods.add(mod);
        when(mapper.updateModificationValue(anyString(), anyString(), anyString(), anyString(), eq("SYSTEM"))).thenReturn(1);
        assertEquals(1, service.updateModifications("FH", "12345", mods, null));
    }

    @Test void shouldUseSystemUserWhenEmpty() {
        List<Map<String, String>> mods = new ArrayList<>();
        Map<String, String> mod = new HashMap<>();
        mod.put("variable", "VAR1");
        mod.put("val", "NEW_VAL");
        mods.add(mod);
        when(mapper.updateModificationValue(anyString(), anyString(), anyString(), anyString(), eq("SYSTEM"))).thenReturn(1);
        assertEquals(1, service.updateModifications("FH", "12345", mods, ""));
    }

    @Test void shouldSkipModificationWhenVariableOrValNull() {
        List<Map<String, String>> mods = new ArrayList<>();
        Map<String, String> mod = new HashMap<>();
        mod.put("variable", "VAR1");
        mods.add(mod);
        assertEquals(0, service.updateModifications("FH", "12345", mods, "user1"));
    }

    @Test void shouldSkipModificationWhenVariableNull() {
        List<Map<String, String>> mods = new ArrayList<>();
        Map<String, String> mod = new HashMap<>();
        mod.put("val", "NEW_VAL");
        mods.add(mod);
        assertEquals(0, service.updateModifications("FH", "12345", mods, "user1"));
    }
}
