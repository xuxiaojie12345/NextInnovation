package com.web.app.service.impl;

import com.web.app.service.UD09DeleteHdocuserdefinedrulesService;
import com.web.app.dto.*;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.entity.HdocUserDefinedRules;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class UD09DeleteHdocuserdefinedrulesServiceImpl implements UD09DeleteHdocuserdefinedrulesService {

    @Autowired
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;

    @Override
    public UD09SearchResponse search(UD09SearchRequest request) {
        Long num = null;
        try {
            if (request.getNumber() != null && !request.getNumber().isEmpty()) {
                num = Long.parseLong(request.getNumber());
            }
        } catch (NumberFormatException e) {
            // ignore
        }
        List<HdocUserDefinedRules> list = hdocUserDefinedRulesMapper.searchByCondition(
                request.getProductClass(), num, request.getMarket(),
                request.getVariable(), request.getValue(),
                request.getString1(), request.getString2(), request.getComments());

        List<UD09SearchResponse.RuleRecord> records = new ArrayList<>();
        for (HdocUserDefinedRules rule : list) {
            UD09SearchResponse.RuleRecord record = new UD09SearchResponse.RuleRecord();
            record.setPc(rule.getPc());
            record.setNum(rule.getNum() != null ? String.valueOf(rule.getNum()) : "");
            record.setMarket(rule.getMarket());
            record.setVariable(rule.getVariable());
            record.setVal(rule.getVal());
            record.setVs(rule.getVs());
            record.setVs2(rule.getVs2());
            record.setComments(rule.getComments());
            record.setAddDate(rule.getAddDate());
            record.setDeleteDate(rule.getDeleteDate());
            record.setRegisterUser(rule.getRegisterUser());
            record.setRegisterDatetime(rule.getRegisterDatetime() != null ? rule.getRegisterDatetime().toString() : "");
            records.add(record);
        }

        return UD09SearchResponse.success(records, records.size());
    }

    @Override
    public UD09DeleteResponse deleteSelected(UD09DeleteSelectedRequest request) {
        if (request.getSelectedRecords() == null || request.getSelectedRecords().isEmpty()) {
            return UD09DeleteResponse.error("No records selected");
        }

        for (UD09DeleteSelectedRequest.SelectedRecord record : request.getSelectedRecords()) {
            Long num = null;
            try {
                if (record.getNum() != null && !record.getNum().isEmpty()) {
                    num = Long.parseLong(record.getNum());
                }
            } catch (NumberFormatException e) {
                // ignore
            }
            hdocUserDefinedRulesMapper.deleteByPcNumMarket(record.getPc(), num, record.getMarket());
        }

        return UD09DeleteResponse.success();
    }
}
