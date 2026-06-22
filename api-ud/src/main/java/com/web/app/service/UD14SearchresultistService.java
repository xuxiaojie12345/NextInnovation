package com.web.app.service;

import java.util.List;
import java.util.Map;

/**
 * UD14_Searchresultist 服务接口
 */
public interface UD14SearchresultistService {

    /**
     * 获取市场列表
     *
     * @return 市场列表
     */
    List<Map<String, Object>> selectMarketMaster();

    /**
     * 根据市场查询规则
     *
     * @param market 市场
     * @return 规则列表
     */
    List<Map<String, Object>> searchByMarket(String market);
}
