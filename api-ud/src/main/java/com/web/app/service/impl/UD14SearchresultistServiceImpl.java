package com.web.app.service.impl;

import com.web.app.service.UD14SearchresultistService;
import com.web.app.dto.*;
import com.web.app.mapper.MarketMasterMapper;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.entity.MarketMaster;
import com.web.app.entity.HdocUserDefinedRules;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class UD14SearchresultistServiceImpl implements UD14SearchresultistService {

    @Autowired
    private MarketMasterMapper marketMasterMapper;
    @Autowired
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;

    @Override
    public UD14MarketListResponse selectMarketMaster() {
        List<MarketMaster> list = marketMasterMapper.selectAll();
        List<UD14MarketListResponse.MarketItem> items = new ArrayList<>();
        for (MarketMaster m : list) {
            UD14MarketListResponse.MarketItem item = new UD14MarketListResponse.MarketItem();
            item.setMarket(m.getMarket());
            items.add(item);
        }
        return UD14MarketListResponse.success(items);
    }

    @Override
    public UD14RulesResponse searchResultList(UD14SearchResultListRequest request) {
        List<HdocUserDefinedRules> list = hdocUserDefinedRulesMapper.selectByMarket(request.getMarket());
        List<UD14RulesResponse.RuleItem> items = new ArrayList<>();
        for (HdocUserDefinedRules rule : list) {
            UD14RulesResponse.RuleItem item = new UD14RulesResponse.RuleItem();
            item.setVariable(rule.getVariable());
            items.add(item);
        }
        return UD14RulesResponse.success(items);
    }
}
