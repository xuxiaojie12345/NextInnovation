package com.web.app.controller;

import com.web.app.dto.UD19SearchResultListRequest;
import com.web.app.dto.UD19SearchResultListResponse;
import com.web.app.service.UD19SearchResultListService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD19 用户搜索结果列表控制器
 *
 * 功能说明：提供市场列表查询和用户搜索接口
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@RestController
@RequestMapping("/api/ud19")
@Api(tags = "UD19 - 用户搜索结果列表")
public class UD19SearchResultListController {

    @Autowired
    private UD19SearchResultListService ud19Service;

    @GetMapping("/getmarket")
    @ApiOperation(value = "获取市场列表", notes = "查询所有市场MARKET列表")
    public UD19SearchResultListResponse getMarket() {
        log.info("收到UD19查询市场列表请求");
        return ud19Service.getMarket();
    }

    @GetMapping("/search")
    @ApiOperation(value = "搜索用户", notes = "根据可选条件搜索用户信息")
    public UD19SearchResultListResponse search(
            @ApiParam(value = "用户ID", example = "user123") @RequestParam(value = "userId", required = false) String userId,
            @ApiParam(value = "用户名", example = "John") @RequestParam(value = "username", required = false) String username,
            @ApiParam(value = "市场", example = "JP") @RequestParam(value = "market", required = false) String market,
            @ApiParam(value = "类型", example = "Standard User") @RequestParam(value = "type", required = false) String type) {
        log.info("收到UD19搜索用户请求");
        UD19SearchResultListRequest request = new UD19SearchResultListRequest();
        request.setUserId(userId);
        request.setUsername(username);
        request.setMarket(market);
        request.setType(type);
        return ud19Service.search(request);
    }
}
