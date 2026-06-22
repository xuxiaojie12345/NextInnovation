package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD20MarketDocumentSettingsService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD20 - 文档列表查询和Market Document Settings API控制器
 */
@RestController
@RequestMapping("/api")
@Api(tags = "UD20-文档列表/Market Document Settings API")
public class UD20MarketDocumentSettingsController {

    @Autowired
    private UD20MarketDocumentSettingsService ud20MarketDocumentSettingsService;

    @GetMapping("/market-document-settings-list/document-list")
    @ApiOperation("查询文档列表")
    public UD20GetDocumentListResponse getDocumentList(UD20GetDocumentListRequest request) {
        return ud20MarketDocumentSettingsService.selectHdocDocumentList(request);
    }

    @PostMapping("/market-document-settings/update")
    @ApiOperation("更新文档设置")
    public UD20MarketDocumentSettingsResponse updateDocumentSettings(@RequestBody UD20MarketDocumentSettingsRequest request) {
        return ud20MarketDocumentSettingsService.updateHdocDocumentList(request);
    }
}
