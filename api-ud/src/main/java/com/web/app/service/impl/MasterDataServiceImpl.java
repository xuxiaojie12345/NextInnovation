package com.web.app.service.impl;

import com.web.app.dto.response.SelectListResponse;
import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.mapper.MarketMasterMapper;
import com.web.app.mapper.ProductClassMasterMapper;
import com.web.app.service.MasterDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MasterDataServiceImpl implements MasterDataService {

    @Autowired
    private ProductClassMasterMapper productClassMasterMapper;
    @Autowired
    private MarketMasterMapper marketMasterMapper;
    @Autowired
    private HdocVariablesMapper hdocVariablesMapper;
    @Autowired
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;

    @Override
    public List<SelectListResponse> getProductClassList() {
        return productClassMasterMapper.selectAll().stream()
            .map(p -> new SelectListResponse(p.getPc(), p.getDescription()))
            .collect(Collectors.toList());
    }

    @Override
    public List<SelectListResponse> getMarketList() {
        return marketMasterMapper.selectAll().stream()
            .map(m -> new SelectListResponse(m.getMarket(), m.getDescription()))
            .collect(Collectors.toList());
    }

    @Override
    public List<SelectListResponse> getVariableList() {
        return hdocVariablesMapper.selectAll().stream()
            .map(v -> new SelectListResponse(v.getVariable(), v.getDescription()))
            .collect(Collectors.toList());
    }

    @Override
    public List<String> getDistinctVariableList() {
        return hdocUserDefinedRulesMapper.selectDistinctVariable();
    }
}
