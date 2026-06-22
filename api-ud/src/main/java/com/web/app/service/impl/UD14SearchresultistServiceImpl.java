package com.web.app.service.impl;

import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.mapper.MarketMasterMapper;
import com.web.app.service.UD14SearchresultistService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * UD14_Searchresultist 服务实现类
 */
@Service
public class UD14SearchresultistServiceImpl implements UD14SearchresultistService {

    private static final Logger logger = LogManager.getLogger(UD14SearchresultistServiceImpl.class);

    @Autowired
    private MarketMasterMapper marketMasterMapper;

    @Autowired
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;

    @Override
    public List<Map<String, Object>> selectMarketMaster() {
        logger.info("查询市场列表");
        return marketMasterMapper.selectAllMarkets();
    }

    @Override
    public List<Map<String, Object>> searchByMarket(String market) {
        logger.info("根据市场查询规则，market: {}", market);
        return hdocUserDefinedRulesMapper.selectByMarket(market);
    }
}
