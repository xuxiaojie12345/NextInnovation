package com.web.app.test;

import com.web.app.dto.DocumentTypeListResponse;
import com.web.app.entity.HdocDocumentList;
import com.web.app.mapper.DocumentListMapper;
import com.web.app.service.impl.DocumentListServiceImpl;
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
@DisplayName("DocumentListServiceImpl Unit Tests")
class DocumentListServiceImplTest {

    @Mock private DocumentListMapper documentListMapper;
    @InjectMocks private DocumentListServiceImpl service;

    @Test void shouldReturnTransformedList() {
        HdocDocumentList entity = new HdocDocumentList();
        entity.setDoctype("HDOC");
        entity.setDescription("HDoc Document");
        when(documentListMapper.findAllDocumentTypes()).thenReturn(Arrays.asList(entity));

        List<DocumentTypeListResponse> result = service.getHdocdocumentlist();

        assertEquals(1, result.size());
        assertEquals("HDOC", result.get(0).getDoctype());
    }

    @Test void shouldReturnEmptyWhenNoData() {
        when(documentListMapper.findAllDocumentTypes()).thenReturn(Arrays.asList());
        assertTrue(service.getHdocdocumentlist().isEmpty());
    }
}
