package com.web.app.service.impl;

import com.web.app.dto.SearchResultResponse;
import com.web.app.dto.MarketListResponse;
import com.web.app.mapper.HdocMarketAuthMapper;
import com.web.app.mapper.MarketMasterMapper;
import com.web.app.service.UD19SearchResultListService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class UD19SearchResultListServiceImpl implements UD19SearchResultListService {

    @Autowired
    private HdocMarketAuthMapper hdocMarketAuthMapper;
    @Autowired
    private MarketMasterMapper marketMasterMapper;

    @Override
    public List<SearchResultResponse> searchHdoc(Map<String, Object> params) {
        List<SearchResultResponse> list = hdocMarketAuthMapper.searchUserList(params);
        // 查不到数据时返回空列表而非抛异常
        return list != null ? list : java.util.Collections.emptyList();
    }

    @Override
    public List<MarketListResponse> selectMarketMaster() {
        return marketMasterMapper.selectMarketWithDescription().stream()
            .map(m -> { 
                MarketListResponse r = new MarketListResponse(); 
                r.setMarket(m.getMarket()); 
                r.setDescription(m.getDescription());
                return r; 
            })
            .collect(Collectors.toList());
    }
}
