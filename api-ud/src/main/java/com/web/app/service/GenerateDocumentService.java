package com.web.app.service;

import com.web.app.dto.GenerateDocumentRequest;
import com.web.app.dto.GenerateDocumentResponse;

public interface GenerateDocumentService {
  GenerateDocumentResponse getGeneratedocument(GenerateDocumentRequest request);
}
