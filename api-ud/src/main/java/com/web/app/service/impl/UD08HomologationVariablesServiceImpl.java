package com.web.app.service.impl;

import com.web.app.dto.*;
import com.web.app.entity.HdocVariables;
import com.web.app.mapper.ProductClassMasterMapper;
import com.web.app.mapper.MarketMasterMapper;
import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.service.UD08HomologationVariablesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UD08HomologationVariablesServiceImpl implements UD08HomologationVariablesService {

    @Autowired
    private ProductClassMasterMapper productClassMasterMapper;
    @Autowired
    private MarketMasterMapper marketMasterMapper;
    @Autowired
    private HdocVariablesMapper hdocVariablesMapper;
    @Autowired
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;

    @Override
    public List<PcListResponse> selectProductClassMaster() {
        return productClassMasterMapper.selectAllPc().stream()
            .map(p -> { PcListResponse r = new PcListResponse(); r.setPc(p.getPc()); return r; })
            .collect(Collectors.toList());
    }

    @Override
    public List<MarketListResponse> selectMarketMaster() {
        return marketMasterMapper.selectAllMarket().stream()
            .map(m -> { MarketListResponse r = new MarketListResponse(); r.setMarket(m.getMarket()); return r; })
            .collect(Collectors.toList());
    }

    @Override
    public HdocVariablesResponse selectHdocVariables(String variable) {
        HdocVariables entity = hdocVariablesMapper.selectByVariable(variable);
        if (entity == null) {
            throw new RuntimeException("数据获取失败");
        }
        HdocVariablesResponse r = new HdocVariablesResponse();
        r.setVariable(entity.getVariable());
        return r;
    }

    @Override
    public void updateHdocUserDefinedRules(Ud08UpdateRequest request) {
        if (request.getPc() == null || request.getNum() == null || request.getMarket() == null) {
            throw new IllegalArgumentException("PC、NUM、MARKET不能为空");
        }
        HdocVariables variable = hdocVariablesMapper.selectByVariable(request.getVariable());
        if (variable == null) {
            throw new RuntimeException("VARIABLE数据不存在，无法更新");
        }
        com.web.app.entity.HdocUserDefinedRules record = new com.web.app.entity.HdocUserDefinedRules();
        record.setPc(request.getPc());
        record.setNum(request.getNum());
        record.setMarket(request.getMarket());
        record.setVariable(request.getVariable());
        record.setVal(request.getVal());
        record.setVs(request.getVs());
        record.setVs2(request.getVs2());
        record.setComments(request.getComments());
        record.setUpdateUser(request.getUpdateUser());
        record.setUpdateDatetime(
            request.getUpdateDatetime() != null ? 
            java.time.LocalDateTime.parse(request.getUpdateDatetime().substring(0, 19)) : 
            java.time.LocalDateTime.now()
        );
        record.setUpdateProcess(request.getUpdateProcess());
        hdocUserDefinedRulesMapper.updateByPcNumMarket(record);
    }

    @Override
    public void addHdocUserDefinedRules(Ud08AddRequest request) {
        HdocVariables variable = hdocVariablesMapper.selectByVariable(request.getVariable());
        if (variable == null) {
            throw new RuntimeException("VARIABLE数据不存在，无法新增");
        }
        com.web.app.entity.HdocUserDefinedRules record = new com.web.app.entity.HdocUserDefinedRules();
        record.setPc(request.getPc());
        record.setNum(request.getNum());
        record.setMarket(request.getMarket());
        record.setVariable(request.getVariable());
        record.setVal(request.getVal());
        record.setVs(request.getVs());
        record.setVs2(request.getVs2());
        record.setComments(request.getComments());
        record.setAddDate(request.getAddDate());
        record.setDeleteDate(request.getDeleteDate());
        record.setRegisterDatetime(
            request.getRegisterDatetime() != null ? 
            java.time.LocalDateTime.parse(request.getRegisterDatetime().substring(0, 19)) : 
            java.time.LocalDateTime.now()
        );
        record.setRegisterUser(request.getRegisterUser());
        record.setRegisterProcess(request.getRegisterProcess());
        record.setUpdateDatetime(
            request.getUpdateDatetime() != null ? 
            java.time.LocalDateTime.parse(request.getUpdateDatetime().substring(0, 19)) : 
            java.time.LocalDateTime.now()
        );
        record.setUpdateUser(request.getUpdateUser());
        record.setUpdateProcess(request.getUpdateProcess());
        hdocUserDefinedRulesMapper.insertUserDefinedRules(record);
    }

    @Override
    public void deleteHdocUserDefinedRules(Ud08DeleteRequest request) {
        hdocUserDefinedRulesMapper.deleteByPcNumMarket(request.getPc(), request.getNum(), request.getMarket());
    }
}
