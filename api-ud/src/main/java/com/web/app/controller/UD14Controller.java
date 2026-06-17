package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD14Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * UD14 Controller
 * 提供市场列表获取、根据市场获取模板文件及使用变量API接口
 */
@Slf4j
@RestController
@CrossOrigin(
    origins = "*",
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class UD14Controller {

    @Autowired
    private UD14Service ud14Service;

    /**
     * 获取市场列表
     * GET /api/ud14Searchresultist/getmarkets
     *
     * @return API响应，包含市场列表
     */
    @GetMapping("/api/ud14Searchresultist/getmarkets")
    public ResponseEntity<ApiResponse<?>> getMarkets() {
        log.info("========== UD14 Controller: Get Markets ==========");

        ApiResponse<?> response = ud14Service.getMarkets();

        log.info("Response code: {}, msg: {}", response.getCode(), response.getMsg());
        log.info("========== UD14 Controller: Get Markets completed ==========");

        return ResponseEntity.ok(response);
    }

    /**
     * 根据市场获取模板文件及使用变量列表
     * POST /api/ud14Searchresultist/getvariablesbymarket
     *
     * @param request 请求体（包含 Market 或 market）
     * @return API响应，包含模板文件列表
     */
    @PostMapping("/api/ud14Searchresultist/getvariablesbymarket")
    public ResponseEntity<ApiResponse<?>> getVariablesByMarket(@RequestBody Map<String, String> request) {
        // 兼容前端发送的 Market 和 market 字段名
        String market = request.get("Market");
        if (market == null) {
            market = request.get("market");
        }

        log.info("========== UD14 Controller: Get Variables By Market ==========");
        log.info("Market: {}", market);

        ApiResponse<?> response = ud14Service.getVariablesByMarket(market);

        log.info("Response code: {}, msg: {}, data size: {}",
                response.getCode(), response.getMsg(),
                response.getData() instanceof java.util.List ?
                ((java.util.List<?>) response.getData()).size() : "N/A");
        log.info("========== UD14 Controller: Get Variables By Market completed ==========");

        return ResponseEntity.ok(response);
    }
}
