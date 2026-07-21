package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.response.RuleSearchRecord;
import com.web.app.dto.response.SearchResultResponse;
import com.web.app.dto.response.DeletedCountResponse;
import com.web.app.dto.request.UD09SearchRequest;
import com.web.app.dto.request.UD09DeleteSelectedRequest;
import com.web.app.dto.request.*;
import com.web.app.dto.response.VariableSearchRecord;
import com.web.app.service.RuleService;
import com.web.app.service.VariableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class SearchController {

    @Autowired
    private RuleService ruleService;
    @Autowired
    private VariableService variableService;

    @PostMapping("/UD09Search")
    public ApiResponse<SearchResultResponse<RuleSearchRecord>> searchRules(@RequestBody UD09SearchRequest request) {
        return ApiResponse.success(ruleService.searchRules(request));
    }

    @PostMapping("/UD09DeleteSelected")
    public ApiResponse<DeletedCountResponse> deleteSelectedRules(@RequestBody UD09DeleteSelectedRequest request) {
        int count = ruleService.deleteSelectedRules(request);
        return ApiResponse.success(new DeletedCountResponse(count), count + " record(s) deleted successfully.");
    }

    @PostMapping("/UD10Search")
    public ApiResponse<SearchResultResponse<VariableSearchRecord>> searchVariables(@RequestBody UD10SearchRequest request) {
        return ApiResponse.success(variableService.searchVariables(request));
    }

    @PostMapping("/UD10Add")
    public ApiResponse<Void> addVariable(@RequestBody UD10AddVariableRequest request) {
        variableService.addVariable(request);
        return ApiResponse.success(null, "Variable added successfully");
    }

    @PostMapping("/UD10Update")
    public ApiResponse<Void> updateVariable(@RequestBody UD10UpdateVariableRequest request) {
        variableService.updateVariable(request);
        return ApiResponse.success(null, "Variable updated successfully");
    }

    @PostMapping("/UD10Delete")
    public ApiResponse<Void> deleteVariable(@RequestBody UD10DeleteRequest request) {
        variableService.deleteVariable(request.getVariable());
        return ApiResponse.success(null, "Variable deleted successfully");
    }

    @PostMapping("/UD11Search")
    public ApiResponse<SearchResultResponse<VariableSearchRecord>> searchVariablesUD11(@RequestBody UD10SearchRequest request) {
        return ApiResponse.success(variableService.searchVariables(request));
    }
}
