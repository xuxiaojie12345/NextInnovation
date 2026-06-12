package com.web.app.service;

import com.web.app.dto.UD05SelectVariableRequest;
import com.web.app.dto.UD05UpdateModificationRequest;
import com.web.app.dto.SelectVariableModificationResponse;
import com.web.app.dto.UpdateModificationResponse;

public interface UD05ModifyDocumentService {
    SelectVariableModificationResponse selectVariableModification(UD05SelectVariableRequest request);
    UpdateModificationResponse updateModification(UD05UpdateModificationRequest request);
}
