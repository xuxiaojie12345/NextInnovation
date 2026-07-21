package com.web.app.service;

import com.web.app.dto.response.VariableSearchRecord;
import com.web.app.dto.response.SearchResultResponse;
import com.web.app.dto.request.UD10AddVariableRequest;
import com.web.app.dto.request.UD10UpdateVariableRequest;
import com.web.app.dto.request.UD10SearchRequest;

public interface VariableService {
    SearchResultResponse<VariableSearchRecord> searchVariables(UD10SearchRequest request);
    void addVariable(UD10AddVariableRequest request);
    void updateVariable(UD10UpdateVariableRequest request);
    void deleteVariable(String variable);
}
