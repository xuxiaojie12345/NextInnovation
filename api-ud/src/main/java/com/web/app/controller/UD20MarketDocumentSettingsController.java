package com.web.app.controller;

import com.web.app.dto.UD20MarketDocumentSettingsRequest;
import com.web.app.dto.UD20MarketDocumentSettingsResponse;
import com.web.app.service.UD20MarketDocumentSettingsService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * UD20-1 市场文档设置更新控制器
 *
 * 功能说明：提供文档设置更新的 REST API 接口
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-07-01
 */
@Slf4j
@RestController
@RequestMapping("/api/ud201")
@Api(tags = "UD20-1 - 市场文档设置更新")
public class UD20MarketDocumentSettingsController {

    @Autowired
    private UD20MarketDocumentSettingsService ud201Service;

    /**
     * 更新文档列表
     * 对应设计文档 4.1 - 客户端通过POST请求访问接口 /api/ud201/updatedocument
     *
     * 接口说明：
     * - Method: POST
     * - Endpoint: /api/ud201/updatedocument
     * - 参数: doctype（必填）, user, date
     * - 返回: 更新结果
     *
     * 处理流程：
     * 1. 接收前端PUT请求及请求体参数
     * 2. 调用 Service 层更新文档列表
     * 3. 返回标准响应格式
     *
     * @param request 请求体，包含 doctype, registerUser, registerDatetime
     * @return UD20MarketDocumentSettingsResponse 响应对象
     */
    @PostMapping("/updatedocument")
    @ApiOperation(value = "更新文档列表", notes = "根据 DOCTYPE 更新 HDOC_DOCUMENT_LIST 表的 REGISTER_USER 和 REGISTER_DATETIME")
    public UD20MarketDocumentSettingsResponse updateDocument(
            @ApiParam(value = "更新请求", required = true) @RequestBody UD20MarketDocumentSettingsRequest request) {

        // 4.2 接收前端请求，通过 Request 对象封装并校验请求参数
        // 4.3 调用 Service 层处理业务逻辑
        UD20MarketDocumentSettingsResponse response = ud201Service.UD20UpdateHdocDocumentList(request);

        return response;
    }
}
