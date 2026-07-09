package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocDocumentList;
import com.web.app.service.UD19Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * UD19 Controller
 * 提供HDoc用户搜索的API接口
 */
@Slf4j
@RestController
@RequestMapping("/api/ud19")
@CrossOrigin(
    origins = "*",
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class UD19Controller {

    @Autowired
    private UD19Service ud19Service;

    /**
     * 获取市场列表
     * GET /api/ud19/getmarketlist
     */
    @GetMapping("/getmarketlist")
    public ResponseEntity<ApiResponse<?>> getMarketList() {

        ApiResponse<?> response = ud19Service.getMarketList();

        return ResponseEntity.ok(response);
    }

    /**
     * 搜索HDOC用户
     * POST /api/ud19/searchhdoc
     */
    @PostMapping("/searchhdoc")
    public ResponseEntity<ApiResponse<?>> searchHdoc(@RequestBody HdocDocumentList request) {

        ApiResponse<?> response = ud19Service.searchHdoc(request);
        return ResponseEntity.ok(response);
    }
}
