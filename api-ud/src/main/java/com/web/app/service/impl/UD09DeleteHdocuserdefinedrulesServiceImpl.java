package com.web.app.service.impl;

import com.web.app.dto.*;
import com.web.app.entity.HdocUserDefinedRules;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.service.UD09DeleteHdocuserdefinedrulesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UD09DeleteHdocuserdefinedrulesServiceImpl implements UD09DeleteHdocuserdefinedrulesService {

    @Autowired
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;

    @Override
    public List<Ud09SearchResponse> searchHdocUserDefinedRules(Ud09SearchRequest request) {
        HdocUserDefinedRules params = new HdocUserDefinedRules();
        params.setPc(request.getPc());
        if (request.getNum() != null && !request.getNum().isEmpty()) {
            try {
                params.setNum(new java.math.BigDecimal(request.getNum()));
            } catch (NumberFormatException e) {
                // ignore invalid num
            }
        }
        params.setMarket(request.getMarket());
        params.setVariable(request.getVariable());
        params.setVal(request.getVal());
        params.setVs(request.getVs());
        params.setVs2(request.getVs2());
        params.setComments(request.getComments());

        List<HdocUserDefinedRules> list = hdocUserDefinedRulesMapper.searchUserDefinedRules(params);
        if (list == null) {
            return java.util.Collections.emptyList();
        }
        return list.stream().map(e -> {
            Ud09SearchResponse r = new Ud09SearchResponse();
            r.setPc(e.getPc());
            r.setNum(e.getNum() != null ? e.getNum().toString() : null);
            r.setMarket(e.getMarket());
            r.setVariable(e.getVariable());
            r.setVal(e.getVal());
            r.setVs(e.getVs());
            r.setVs2(e.getVs2());
            r.setComments(e.getComments());
            r.setAddDate(e.getAddDate());
            r.setDeleteDate(e.getDeleteDate());
            r.setUpdateUser(e.getUpdateUser());
            r.setRegisterUser(e.getRegisterUser());
            r.setUpdateDatetime(e.getUpdateDatetime() != null ? e.getUpdateDatetime().toString() : null);
            r.setRegisterDatetime(e.getRegisterDatetime() != null ? e.getRegisterDatetime().toString() : null);
            return r;
        }).collect(Collectors.toList());
    }

    @Override
    public void deleteSelected(Ud09SearchRequest request) {
        HdocUserDefinedRules params = new HdocUserDefinedRules();
        params.setPc(request.getPc());
        if (request.getNum() != null) params.setNum(new java.math.BigDecimal(request.getNum()));
        params.setMarket(request.getMarket());
        int result = hdocUserDefinedRulesMapper.deleteSelected(params);
        if (result <= 0) {
            throw new RuntimeException("数据删除失败");
        }
    }

    @Override
    public int countHdocUserDefinedRules(Ud09SearchRequest request) {
        HdocUserDefinedRules params = new HdocUserDefinedRules();
        params.setPc(request.getPc());
        if (request.getNum() != null && !request.getNum().isEmpty()) {
            try {
                params.setNum(new java.math.BigDecimal(request.getNum()));
            } catch (NumberFormatException e) {
                // ignore invalid num
            }
        }
        params.setMarket(request.getMarket());
        params.setVariable(request.getVariable());
        params.setVal(request.getVal());
        params.setVs(request.getVs());
        params.setVs2(request.getVs2());
        params.setComments(request.getComments());
        return hdocUserDefinedRulesMapper.countUserDefinedRules(params);
    }
}
