package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.response.SelectListResponse;
import com.web.app.dto.request.*;
import com.web.app.service.MasterDataService;
import com.web.app.service.RuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class HomologationVariablesController {

    @Autowired
    private MasterDataService masterDataService;
    @Autowired
    private RuleService ruleService;

    @GetMapping("/UD08SelectProductclassmaster")
    public ApiResponse<List<SelectListResponse>> getProductClassMaster() {
        return ApiResponse.success(masterDataService.getProductClassList());
    }

    @GetMapping("/UD08SelectMarketmaster")
    public ApiResponse<List<SelectListResponse>> getMarketMaster() {
        return ApiResponse.success(masterDataService.getMarketList());
    }

    @GetMapping("/UD08SelectHdocvariables")
    public ApiResponse<List<SelectListResponse>> getHdocVariables() {
        return ApiResponse.success(masterDataService.getVariableList());
    }

    @PostMapping("/UD08Add")
    public ApiResponse<Void> addRule(@RequestBody UD08AddRuleRequest request) {
        ruleService.addRule(request);
        return ApiResponse.success(null, "Rule added successfully");
    }

    @PostMapping("/UD08Update")
    public ApiResponse<Void> updateRule(@RequestBody UD08UpdateRuleRequest request) {
        ruleService.updateRule(request);
        return ApiResponse.success(null, "Rule updated successfully");
    }

    @PostMapping("/UD08Delete")
    public ApiResponse<Void> deleteRule(@RequestBody UD08DeleteRuleRequest request) {
        ruleService.deleteRule(request);
        return ApiResponse.success(null, "Rule deleted successfully");
    }
}
