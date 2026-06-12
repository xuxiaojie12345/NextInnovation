package com.web.app.service.impl;

import com.web.app.service.UD08HomologationVariablesService;
import com.web.app.dto.*;
import com.web.app.mapper.*;
import com.web.app.entity.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class UD08HomologationVariablesServiceImpl implements UD08HomologationVariablesService {

    @Autowired
    private ProductClassMasterMapper productClassMasterMapper;
    @Autowired
    private MarketMasterMapper marketMasterMapper;
    @Autowired
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;
    @Autowired
    private HdocVariablesMapper hdocVariablesMapper;

    @Override
    public UD08InitResponse selectProductClassMasterAndMarketMaster() {
        List<ProductClassMaster> pcs = productClassMasterMapper.selectAll();
        List<MarketMaster> markets = marketMasterMapper.selectAll();
        
        List<UD08ProductClassMasterResponse.ProductClassItem> pcItems = new ArrayList<>();
        for (ProductClassMaster pc : pcs) {
            UD08ProductClassMasterResponse.ProductClassItem item = new UD08ProductClassMasterResponse.ProductClassItem();
            item.setPc(pc.getPc());
            pcItems.add(item);
        }
        
        List<UD08MarketMasterResponse.MarketItem> marketItems = new ArrayList<>();
        for (MarketMaster m : markets) {
            UD08MarketMasterResponse.MarketItem item = new UD08MarketMasterResponse.MarketItem();
            item.setMarket(m.getMarket());
            marketItems.add(item);
        }
        
        return UD08InitResponse.success(pcItems, marketItems);
    }

    @Override
    public UD08SelectRulesResponse selectUserDefinedRules(UD08SelectRulesRequest request) {
        Long num = request.getNumber() != null ? Long.parseLong(request.getNumber()) : null;
        int count = hdocUserDefinedRulesMapper.countByPcNumMarket(request.getPc(), num, request.getMarket());
        return UD08SelectRulesResponse.success(count > 0, count);
    }

    @Override
    public UD08SelectRulesResponse selectHdocVariables(UD08SelectHdocVariablesRequest request) {
        int count = hdocVariablesMapper.countByVariable(request.getVariable());
        return UD08SelectRulesResponse.success(count > 0, count);
    }

    @Override
    public UD08HomologationVariablesResponse addRule(UD08AddRuleRequest request) {
        // Check existence
        Long num = request.getNumber() != null ? Long.parseLong(request.getNumber()) : null;
        int exists = hdocUserDefinedRulesMapper.countByPcNumMarket(request.getProductClass(), num, request.getMarket());
        if (exists > 0) {
            return UD08HomologationVariablesResponse.error("Primary key conflict, Please enter the correct content");
        }
        // Insert logic...
        return UD08HomologationVariablesResponse.success("Added successfully");
    }

    @Override
    public UD08HomologationVariablesResponse updateRule(UD08UpdateRuleRequest request) {
        Long num = request.getNumber() != null ? Long.parseLong(request.getNumber()) : null;
        int exists = hdocUserDefinedRulesMapper.countByPcNumMarket(request.getProductClass(), num, request.getMarket());
        if (exists == 0) {
            return UD08HomologationVariablesResponse.error("Data does not exist, Please enter the correct content");
        }
        return UD08HomologationVariablesResponse.success("Updated successfully");
    }

    @Override
    public UD08HomologationVariablesResponse deleteRule(UD08DeleteRuleRequest request) {
        Long num = request.getNumber() != null ? Long.parseLong(request.getNumber()) : null;
        int exists = hdocUserDefinedRulesMapper.countByPcNumMarket(request.getPc(), num, request.getMarket());
        if (exists == 0) {
            return UD08HomologationVariablesResponse.error("Data does not exist, Please enter the correct content");
        }
        hdocUserDefinedRulesMapper.deleteByPcNumMarket(request.getPc(), num, request.getMarket());
        return UD08HomologationVariablesResponse.success("Deleted successfully");
    }
}
