package com.web.app.service;

import com.web.app.dto.SearchResultResponse;
import com.web.app.dto.MarketListResponse;
import java.util.List;
import java.util.Map;

public interface UD19SearchResultListService {
    List<SearchResultResponse> searchHdoc(Map<String, Object> params);
    List<MarketListResponse> selectMarketMaster();
}
