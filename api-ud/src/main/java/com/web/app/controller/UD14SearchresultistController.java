package com.web.app.controller;

import com.web.app.dto.UD14SearchresultistRequest;
import com.web.app.dto.UD14SearchresultistResponse;
import com.web.app.service.UD14SearchresultistService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD14 搜索结果列表控制器
 *
 * 功能说明：提供市场列表和变量搜索查询接口
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@RestController
@RequestMapping("/api/ud14")
@Api(tags = "UD14 - 搜索结果列表")
public class UD14SearchresultistController {

    @Autowired
    private UD14SearchresultistService ud14Service;

    @GetMapping("/market")
    @ApiOperation(value = "获取市场列表", notes = "查询所有市场MARKET列表")
    public UD14SearchresultistResponse getMarket() {
        log.info("收到UD14查询市场列表请求");
        return ud14Service.selectMarketMaster();
    }

    @GetMapping("/user-defined-rules")
    @ApiOperation(value = "获取用户定义规则变量列表", notes = "根据市场查询HDOC_USER_DEFINED_RULES表中的变量列表")
    public UD14SearchresultistResponse getUserDefinedRules(
            @ApiParam(value = "市场", required = true, example = "JP") @RequestParam("market") String market) {
        log.info("收到UD14查询用户定义规则变量请求, market: {}", market);
        UD14SearchresultistRequest request = new UD14SearchresultistRequest();
        request.setMarket(market);
        return ud14Service.selectUserDefinedRules(request);
    }
}
