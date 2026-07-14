package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD12Service;
import com.web.app.service.UD14Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
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

    @Autowired
    private UD12Service ud12Service;

    /**
     * 获取市场列表
     * GET /api/ud14Searchresultist/getmarkets
     *
     * @return API响应，包含市场列表
     */
    @GetMapping("/api/ud14Searchresultist/getmarkets")
    public ResponseEntity<ApiResponse<?>> getMarkets() {

        ApiResponse<?> response = ud14Service.getMarkets();

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

        ApiResponse<?> response = ud14Service.getVariablesByMarket(market);

        return ResponseEntity.ok(response);
    }

    /**
     * 下载模板文件
     * GET /api/ud14Searchresultist/download/{market}/{fileName}
     *
     * @param market   市场代码
     * @param fileName 文件名
     * @return 文件流
     */
    @GetMapping("/api/ud14Searchresultist/download/{market}/{fileName}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable String market,
            @PathVariable String fileName) {
        Resource resource = ud12Service.downloadFile(market, fileName);
        if (resource == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8)
                    .replace("+", "%20");
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename*=UTF-8''" + encodedFileName)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
