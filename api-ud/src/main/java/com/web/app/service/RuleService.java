package com.web.app.service;

import com.web.app.dto.response.RuleSearchRecord;
import com.web.app.dto.response.SearchResultResponse;
import com.web.app.dto.request.UD08AddRuleRequest;
import com.web.app.dto.request.UD08UpdateRuleRequest;
import com.web.app.dto.request.UD08DeleteRuleRequest;
import com.web.app.dto.request.UD09SearchRequest;
import com.web.app.dto.request.UD09DeleteSelectedRequest;

public interface RuleService {
    void addRule(UD08AddRuleRequest request);
    void updateRule(UD08UpdateRuleRequest request);
    void deleteRule(UD08DeleteRuleRequest request);
    SearchResultResponse<RuleSearchRecord> searchRules(UD09SearchRequest request);
    int deleteSelectedRules(UD09DeleteSelectedRequest request);
}
