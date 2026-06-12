package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD14SearchresultistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ud14searchresultist")
public class UD14SearchresultistController {

    @Autowired
    private UD14SearchresultistService ud14SearchresultistService;

    @PostMapping("/selectmarketmaster")
    public UD14MarketListResponse selectMarketMaster() {
        return ud14SearchresultistService.selectMarketMaster();
    }

    @PostMapping("/searchresultist")
    public UD14RulesResponse searchResultList(@RequestBody UD14SearchResultListRequest request) {
        return ud14SearchresultistService.searchResultList(request);
    }
}
