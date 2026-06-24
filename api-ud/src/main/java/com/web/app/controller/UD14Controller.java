package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD14Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * UD14控制器 - UD14SearchresultistApi
 * 对应全体APIのプロンプト.txt 【UD14SearchresultistApi】
 *
 * 功能：
 * 1. UD14SelectMarketmaster - 市场列表查询
 * 2. UD14SelectHdocuserdefinedrules - 模板文件列表及使用状态查询
 */
@RestController
@RequestMapping("/api/ud14")
public class UD14Controller {

    private static final Logger logger = LoggerFactory.getLogger(UD14Controller.class);

    @Autowired
    private UD14Service ud14Service;

    /**
     * UD14SelectMarketmaster - 获取市场列表
     * GET /api/ud14/UD14SelectMarketmaster（无参数）
     */
    @GetMapping("/UD14SelectMarketmaster")
    public ApiResponse<Map<String, Object>> selectMarketMaster() {
        logger.info("UD14SelectMarketmaster called");
        try {
            return ApiResponse.success(ud14Service.selectMarketMaster());
        } catch (Exception e) {
            logger.error("UD14SelectMarketmaster error", e);
            return ApiResponse.serverError();
        }
    }

    /**
     * UD14SelectHdocuserdefinedrules - 模板文件列表及使用状态查询
     * GET /api/ud14/UD14SelectHdocuserdefinedrules?market={marketCode}
     */
    @GetMapping("/UD14SelectHdocuserdefinedrules")
    public ApiResponse<Map<String, Object>> selectHdocUserDefinedRules(
            @RequestParam("market") String market) {
        logger.info("UD14SelectHdocuserdefinedrules called - market: {}", market);
        if (market == null || market.trim().isEmpty()) {
            return ApiResponse.error(400, "Market code is required.");
        }
        try {
            return ApiResponse.success(ud14Service.selectHdocUserDefinedRules(market.trim()));
        } catch (Exception e) {
            logger.error("UD14SelectHdocuserdefinedrules error", e);
            return ApiResponse.serverError();
        }
    }
}
