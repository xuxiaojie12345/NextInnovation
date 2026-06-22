package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD14SearchresultistService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD14_Searchresultist 控制器
 * 提供市场列表查询和规则注册信息查询功能
 */
@RestController
@RequestMapping("/api/ud14searchresultist")
@Api(tags = "UD14-搜索结果列表")
public class UD14SearchresultistController {

    private static final Logger logger = LogManager.getLogger(UD14SearchresultistController.class);

    @Autowired
    private UD14SearchresultistService ud14SearchresultistService;

    /**
     * 获取市场列表（初始化）
     *
     * @return 统一响应对象，包含市场列表
     */
    @GetMapping("/selectmarketmaster")
    @ApiOperation(value = "获取市场列表", notes = "查询MARKET_MASTER表获取所有市场")
    public ApiResponse<Map<String, Object>> selectMarketMaster() {
        logger.info("接收到获取市场列表请求");

        try {
            List<Map<String, Object>> markets = ud14SearchresultistService.selectMarketMaster();

            Map<String, Object> data = new HashMap<>();
            data.put("markets", markets);

            return ApiResponse.success("查询成功", data);
        } catch (Exception e) {
            logger.error("获取市场列表失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 根据市场查询规则信息
     *
     * @param market 市场
     * @return 统一响应对象，包含规则列表
     */
    @GetMapping("/searchresultist")
    @ApiOperation(value = "查询规则信息", notes = "根据市场查询HDOC_USER_DEFINED_RULES表中的规则信息")
    public ApiResponse<Map<String, Object>> searchResultList(@RequestParam("market") String market) {

        logger.info("接收到查询规则信息请求，market: {}", market);

        try {
            if (market == null || market.trim().isEmpty()) {
                return ApiResponse.error("Market is required");
            }

            List<Map<String, Object>> rules = ud14SearchresultistService.searchByMarket(market);

            Map<String, Object> data = new HashMap<>();
            data.put("rules", rules);

            return ApiResponse.success("查询成功", data);
        } catch (Exception e) {
            logger.error("查询规则信息失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }
}
