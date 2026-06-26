package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD20Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * UD20 Controller
 * 提供文档类型列表的API接口
 */
@Slf4j
@RestController
@RequestMapping("/api/ud20")
@CrossOrigin(
    origins = "*",
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class UD20Controller {

    @Autowired
    private UD20Service ud20Service;

    /**
     * 搜索文档类型列表
     * POST /api/ud20/getdocumentlist
     *
     * Request Body:
     * {
     *   "documentType": "xxx",
     *   "operator": "="
     * }
     * operator = "="   → 等于检索
     * operator = ">" 或 "<" → 不等于检索
     */
    @PostMapping("/getdocumentlist")
    public ResponseEntity<ApiResponse<?>> getDocumentList(@RequestBody Map<String, String> request) {
        log.info("========== UD20 Controller: Get Document List ==========");

        String documentType = request.getOrDefault("documentType", "");
        String operator = request.getOrDefault("operator", "=");

        log.info("Search params - documentType: {}, operator: {}", documentType, operator);

        ApiResponse<?> response = ud20Service.searchDocumentList(documentType, operator);

        log.info("Response code: {}, msg: {}", response.getCode(), response.getMsg());
        log.info("========== UD20 Controller: Get Document List completed ==========");

        return ResponseEntity.ok(response);
    }
}
