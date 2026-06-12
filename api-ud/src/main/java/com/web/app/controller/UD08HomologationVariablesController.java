package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD08HomologationVariablesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ud08")
public class UD08HomologationVariablesController {

    @Autowired
    private UD08HomologationVariablesService ud08HomologationVariablesService;

    @GetMapping("/select-product-class-master")
    public UD08InitResponse init() {
        return ud08HomologationVariablesService.selectProductClassMasterAndMarketMaster();
    }

    @GetMapping("/select-market-master")
    public UD08InitResponse selectMarketMaster() {
        return ud08HomologationVariablesService.selectProductClassMasterAndMarketMaster();
    }

    @PostMapping("/select-user-defined-rules")
    public UD08SelectRulesResponse selectUserDefinedRules(@RequestBody UD08SelectRulesRequest request) {
        return ud08HomologationVariablesService.selectUserDefinedRules(request);
    }

    @PostMapping("/select-hdoc-variables")
    public UD08SelectRulesResponse selectHdocVariables(@RequestBody UD08SelectHdocVariablesRequest request) {
        return ud08HomologationVariablesService.selectHdocVariables(request);
    }

    @PostMapping("/add")
    public UD08HomologationVariablesResponse addRule(@RequestBody UD08AddRuleRequest request) {
        return ud08HomologationVariablesService.addRule(request);
    }

    @PostMapping("/update")
    public UD08HomologationVariablesResponse updateRule(@RequestBody UD08UpdateRuleRequest request) {
        return ud08HomologationVariablesService.updateRule(request);
    }

    @PostMapping("/delete")
    public UD08HomologationVariablesResponse deleteRule(@RequestBody UD08DeleteRuleRequest request) {
        return ud08HomologationVariablesService.deleteRule(request);
    }
}
