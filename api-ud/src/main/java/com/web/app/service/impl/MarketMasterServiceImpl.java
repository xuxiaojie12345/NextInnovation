package com.web.app.service.impl;

import com.web.app.entity.MarketMaster;
import com.web.app.mapper.MarketMasterMapper;
import com.web.app.service.MarketMasterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MarketMasterServiceImpl implements MarketMasterService {

    @Autowired
    private MarketMasterMapper marketMasterMapper;

    @Override
    public List<MarketMaster> selectAllMarkets() {
        return marketMasterMapper.selectAllMarkets();
    }
}
