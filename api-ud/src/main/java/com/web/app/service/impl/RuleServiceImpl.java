package com.web.app.service.impl;

import com.web.app.dto.response.RuleSearchRecord;
import com.web.app.dto.response.SearchResultResponse;
import com.web.app.dto.request.*;
import com.web.app.entity.HdocUserDefinedRules;
import com.web.app.exception.BusinessException;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.service.RuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RuleServiceImpl implements RuleService {

    @Autowired
    private HdocUserDefinedRulesMapper rulesMapper;

    @Override
    public void addRule(UD08AddRuleRequest request) {
        HdocUserDefinedRules entity = new HdocUserDefinedRules();
        entity.setPc(request.getPc());
        entity.setNum(request.getNum() != null ? new java.math.BigDecimal(request.getNum()) : null);
        entity.setMarket(request.getMarket());
        entity.setVs(request.getVs());
        entity.setVs2(request.getVs2());
        entity.setVariable(request.getVariable());
        entity.setVal(request.getVal());
        entity.setComments(request.getComments());
        entity.setAddDate(request.getAddDate());
        entity.setDeleteDate(request.getDeleteDate());
        entity.setUserId(request.getUserId());
        entity.setRegisterDatetime(java.time.LocalDateTime.now());
        entity.setRegisterUser(request.getUserId() != null ? request.getUserId() : "system");
        entity.setRegisterProcess("UD08Add");
        entity.setUpdateDatetime(java.time.LocalDateTime.now());
        entity.setUpdateUser(request.getUserId() != null ? request.getUserId() : "system");
        entity.setUpdateProcess("UD08Add");
        entity.setUpDate(java.time.LocalDate.now().toString());
        rulesMapper.insert(entity);
    }

    @Override
    public void updateRule(UD08UpdateRuleRequest request) {
        HdocUserDefinedRules entity = rulesMapper.selectByPcNumMarket(request.getPc(), request.getNum(), request.getMarket());
        if (entity == null) {
            throw new BusinessException(404, "Rule not found");
        }
        entity.setVs(request.getVs());
        entity.setVs2(request.getVs2());
        entity.setVariable(request.getVariable());
        entity.setVal(request.getVal());
        entity.setComments(request.getComments());
        entity.setAddDate(request.getAddDate());
        entity.setDeleteDate(request.getDeleteDate());
        rulesMapper.update(entity);
    }

    @Override
    public void deleteRule(UD08DeleteRuleRequest request) {
        rulesMapper.deleteByPcNumMarket(request.getPc(), request.getNum(), request.getMarket());
    }

    @Override
    public SearchResultResponse<RuleSearchRecord> searchRules(UD09SearchRequest request) {
        List<HdocUserDefinedRules> list = rulesMapper.selectByCondition(
            request.getPc(), request.getNum(), request.getMarket(),
            request.getVariable(), request.getVal(), request.getVs(), request.getVs2(),
            request.getComments(), request.getAddDateFrom(), request.getAddDateTo(),
            request.getDeleteDateFrom(), request.getDeleteDateTo(), request.getCreatedByUser());
        List<RuleSearchRecord> records = list.stream().map(r -> {
            RuleSearchRecord rec = new RuleSearchRecord();
            rec.setPc(r.getPc());
            rec.setNum(r.getNum() != null ? r.getNum().toString() : null);
            rec.setMarket(r.getMarket());
            rec.setVs(r.getVs());
            rec.setVs2(r.getVs2());
            rec.setVariable(r.getVariable());
            rec.setVal(r.getVal());
            rec.setComments(r.getComments());
            rec.setAddDate(r.getAddDate());
            rec.setDeleteDate(r.getDeleteDate());
            rec.setRegisterUser(r.getRegisterUser());
            rec.setRegisterDatetime(r.getRegisterDatetime() != null ? r.getRegisterDatetime().toString() : null);
            return rec;
        }).collect(Collectors.toList());
        return new SearchResultResponse<>(records.size(), records);
    }

    @Override
    public int deleteSelectedRules(UD09DeleteSelectedRequest request) {
        List<HdocUserDefinedRules> entities = request.getSelectedRecords().stream().map(k -> {
            HdocUserDefinedRules e = new HdocUserDefinedRules();
            e.setPc(k.getPc());
            e.setNum(new java.math.BigDecimal(k.getNum()));
            e.setMarket(k.getMarket());
            return e;
        }).collect(Collectors.toList());
        return rulesMapper.deleteBatch(entities);
    }
}
