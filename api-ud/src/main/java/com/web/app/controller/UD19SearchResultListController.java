package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD19SearchResultListService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UD19SearchResultListController {

    @Autowired
    private UD19SearchResultListService searchResultListService;

    @PostMapping("/ud19/searchhdoc")
    public ResponseEntity<ApiResponse<List<SearchResultResponse>>> searchHdoc(
        @RequestBody Ud19SearchRequest request) {
        Map<String, Object> params = new HashMap<>();
        params.put("userid", request.getUserid());
        params.put("userName", request.getUserName());
        params.put("type", request.getType());
        params.put("market", request.getMarket());
        List<SearchResultResponse> list = searchResultListService.searchHdoc(params);
        return ResponseEntity.ok(ApiResponse.success("登录成功", list));
    }

    @PostMapping("/ud19/selectmarketmaster")
    public ResponseEntity<ApiResponse<List<MarketListResponse>>> selectMarketMaster() {
        List<MarketListResponse> list = searchResultListService.selectMarketMaster();
        return ResponseEntity.ok(ApiResponse.success("登录成功", list));
    }
}
