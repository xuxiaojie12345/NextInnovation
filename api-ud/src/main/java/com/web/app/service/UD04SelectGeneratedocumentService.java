package com.web.app.service;

import com.web.app.dto.SelectGenerateDocumentResponse;

public interface UD04SelectGeneratedocumentService {
    SelectGenerateDocumentResponse selectHdocRecDataOm(String serie, String chnr);
}
