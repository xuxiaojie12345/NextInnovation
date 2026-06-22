package com.web.app.service;

import com.web.app.entity.HdocUserDefinedRules;
import com.web.app.entity.ProductClassMaster;
import com.web.app.entity.MarketMaster;
import java.util.List;
import java.util.Map;

public interface UD08HomologationVariablesService {
    List<ProductClassMaster> selectProductClassMaster();
    List<MarketMaster> selectMarketMaster();
    boolean checkVariable(String variable);
    boolean checkRule(String pc, String num, String market);
    int addRule(HdocUserDefinedRules rule);
    int updateRule(HdocUserDefinedRules rule);
    int deleteRule(String pc, String num, String market);
    List<Map<String, Object>> searchRules(String pc, String num, String market, String variable, String val,
        String pcOp1, String numOp1, String marketOp1, String variableOp1, String valOp1,
        String vs, String vsOp1, String vsOp2, String vsVal2,
        String comments, String commentsOp1,
        String addDate, String addDateOp1,
        String deleteDate, String deleteDateOp1,
        String createdBy, String createdByOp1,
        String date, String dateOp1);
    int deleteSelectedRules(List<Map<String, Object>> records);
}
