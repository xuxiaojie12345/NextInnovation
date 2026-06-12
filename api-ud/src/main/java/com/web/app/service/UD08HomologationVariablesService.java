package com.web.app.service;

import com.web.app.dto.*;

public interface UD08HomologationVariablesService {
    UD08InitResponse selectProductClassMasterAndMarketMaster();
    UD08SelectRulesResponse selectUserDefinedRules(UD08SelectRulesRequest request);
    UD08SelectRulesResponse selectHdocVariables(UD08SelectHdocVariablesRequest request);
    UD08HomologationVariablesResponse addRule(UD08AddRuleRequest request);
    UD08HomologationVariablesResponse updateRule(UD08UpdateRuleRequest request);
    UD08HomologationVariablesResponse deleteRule(UD08DeleteRuleRequest request);
}
