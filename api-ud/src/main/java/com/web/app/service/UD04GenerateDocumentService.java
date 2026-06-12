package com.web.app.service;

import com.web.app.dto.UD04GenerateDocumentRequest;
import com.web.app.dto.UD04GenerateDocumentResponse;

public interface UD04GenerateDocumentService {
    UD04GenerateDocumentResponse getGeneratedDocumentInfo(UD04GenerateDocumentRequest request);
}
