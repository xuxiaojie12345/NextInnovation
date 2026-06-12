package com.web.app.service;

import com.web.app.dto.*;

public interface UD14SearchresultistService {
    UD14MarketListResponse selectMarketMaster();
    UD14RulesResponse searchResultList(UD14SearchResultListRequest request);
}
