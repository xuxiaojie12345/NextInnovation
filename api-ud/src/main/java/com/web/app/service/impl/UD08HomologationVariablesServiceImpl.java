package com.web.app.service.impl;

import com.web.app.entity.HdocUserDefinedRules;
import com.web.app.entity.MarketMaster;
import com.web.app.entity.ProductClassMaster;
import com.web.app.mapper.UD08HomologationVariablesMapper;
import com.web.app.service.UD08HomologationVariablesService;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UD08HomologationVariablesServiceImpl implements UD08HomologationVariablesService {

  @Autowired
  private UD08HomologationVariablesMapper mapper;

  @Override
  public List<ProductClassMaster> selectProductClassMaster() {
    return mapper.selectProductClassMaster();
  }

  @Override
  public List<MarketMaster> selectMarketMaster() {
    return mapper.selectMarketMaster();
  }

  @Override
  public boolean checkVariable(String variable) {
    return mapper.countVariable(variable) > 0;
  }

  @Override
  public boolean checkRule(String pc, String num, String market) {
    return mapper.countDefinedRules(pc, num, market) > 0;
  }

  @Override
  public int addRule(HdocUserDefinedRules rule) {
    if (rule.getRegisterUser() == null || rule.getRegisterUser().trim().isEmpty()) {
      rule.setRegisterUser("SYSTEM");
    }
    if (rule.getUpdateUser() == null || rule.getUpdateUser().trim().isEmpty()) {
      rule.setUpdateUser("SYSTEM");
    }
    return mapper.insertRule(rule);
  }

  @Override
  public int updateRule(HdocUserDefinedRules rule) {
    if (rule.getUpdateUser() == null || rule.getUpdateUser().trim().isEmpty()) {
      rule.setUpdateUser("SYSTEM");
    }
    return mapper.updateRule(rule);
  }

  @Override
  public int deleteRule(String pc, String num, String market) {
    return mapper.deleteRule(pc, num, market);
  }

  @Override
  public List<Map<String, Object>> searchRules(
      String pc,
      String num,
      String market,
      String variable,
      String val,
      String pcOp1,
      String numOp1,
      String marketOp1,
      String variableOp1,
      String valOp1,
      String vs,
      String vsOp1,
      String vsOp2,
      String vsVal2,
      String comments,
      String commentsOp1,
      String addDate,
      String addDateOp1,
      String deleteDate,
      String deleteDateOp1,
      String createdBy,
      String createdByOp1,
      String date,
      String dateOp1) {
    return mapper.searchRules(
        pc,
        num,
        market,
        variable,
        val,
        pcOp1,
        numOp1,
        marketOp1,
        variableOp1,
        valOp1,
        vs,
        vsOp1,
        vsOp2,
        vsVal2,
        comments,
        commentsOp1,
        addDate,
        addDateOp1,
        deleteDate,
        deleteDateOp1,
        createdBy,
        createdByOp1,
        date,
        dateOp1);
  }

  @Override
  public int deleteSelectedRules(List<Map<String, Object>> records) {
    List<UD08HomologationVariablesMapper.RuleKey> keys =
        records.stream()
            .map(
                r -> {
                  UD08HomologationVariablesMapper.RuleKey k =
                      new UD08HomologationVariablesMapper.RuleKey();
                  k.setPc(String.valueOf(r.get("pc")));
                  k.setNum(String.valueOf(r.get("num")));
                  k.setMarket(String.valueOf(r.get("market")));
                  return k;
                })
            .collect(Collectors.toList());
    return mapper.deleteSelectedRules(keys);
  }
}
