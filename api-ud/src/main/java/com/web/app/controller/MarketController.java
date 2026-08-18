package com.web.app.controller;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.MarketListResponse;
import com.web.app.service.SearchUserService;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

/**
 * Market 列表控制器
 * 对应设计书 3.1.1：画面初期表示时请求 API 加载 Market 列表
 */
@Api(tags = "MarketApi - Market主数据")
@RestController
@RequestMapping("/api/Market")
public class MarketController {

    private static final Logger logger = LogManager.getLogger(MarketController.class);

    @Autowired
    private SearchUserService searchUserService;

    /**
     * Market 列表检索
     * 数据源：MARKET_MASTER 表（对应 SQL 5.1）
     * 异常处理：加载失败返回 code=500，前端下拉显示为空不阻断画面表示
     */
    @ApiOperation("Market 列表检索")
    @GetMapping("/getMarketList")
    public ApiResponse<MarketListResponse> getMarketList() {
        try {
            return ApiResponse.success(searchUserService.getMarketList());
        } catch (Exception e) {
            logger.error("Market 列表检索异常", e);
            return ApiResponse.error(500, "Internal server error");
        }
    }
}
