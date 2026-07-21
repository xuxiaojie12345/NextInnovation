package com.web.app.service;

import com.web.app.dto.response.ModificationDetailResponse;
import com.web.app.dto.response.VariableModificationResponse;
import com.web.app.dto.request.UD05UpdateModificationRequest;

public interface ModificationService {
    VariableModificationResponse getVariableModification(String chassisNo);
    void updateModification(UD05UpdateModificationRequest request);
    ModificationDetailResponse getModificationDetail(String serie, String chassisNo);
}
