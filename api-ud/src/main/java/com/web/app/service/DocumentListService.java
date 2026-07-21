package com.web.app.service;

import com.web.app.dto.response.DocumentListRecord;
import com.web.app.dto.response.DocumentTypeListResponse;
import java.util.List;

public interface DocumentListService {
    DocumentTypeListResponse getDocumentTypes();
    List<DocumentListRecord> getDocumentList();
}
