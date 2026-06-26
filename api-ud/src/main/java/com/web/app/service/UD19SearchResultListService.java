package com.web.app.service;

import com.web.app.dto.UD19SearchResultListRequest;
import com.web.app.dto.UD19SearchResultListResponse;

/**
 * UD19 - Search Result List服务接口
 */
public interface UD19SearchResultListService {

    /**
     * 搜索HDoc用户
     */
    UD19SearchResultListResponse searchHdoc(UD19SearchResultListRequest request);

    /**
     * 获取市场列表（从MARKET_MASTER无条件取得）
     */
    UD19SearchResultListResponse selectMarketMaster();
}
