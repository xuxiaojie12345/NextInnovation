package com.web.app.controller;

import com.web.app.dto.UD20MarketDocumentSettingsRequest;
import com.web.app.dto.UD20MarketDocumentSettingsResponse;
import com.web.app.service.UD20MarketDocumentSettingsService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD20 市场文档设置控制器
 *
 * 功能说明：提供文档列表查询接口
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@RestController
@RequestMapping("/api/ud20")
@Api(tags = "UD20 - 市场文档设置")
public class UD20MarketDocumentSettingsController {

    @Autowired
    private UD20MarketDocumentSettingsService ud20Service;

    @GetMapping("/getdocumentlist")
    @ApiOperation(value = "获取文档列表", notes = "根据可选条件查询HDOC_DOCUMENT_LIST表中的文档信息")
    public UD20MarketDocumentSettingsResponse getDocumentList(
            @ApiParam(value = "文档类型", example = "Homologation Certificate") @RequestParam(value = "doctype", required = false) String doctype,
            @ApiParam(value = "注册用户", example = "john.doe") @RequestParam(value = "registerUser", required = false) String registerUser,
            @ApiParam(value = "注册时间", example = "2026-05-15 10:30:00") @RequestParam(value = "registerDatetime", required = false) String registerDatetime) {
        log.info("收到UD20查询文档列表请求");
        UD20MarketDocumentSettingsRequest request = new UD20MarketDocumentSettingsRequest();
        request.setDoctype(doctype);
        request.setRegisterUser(registerUser);
        request.setRegisterDatetime(registerDatetime);
        return ud20Service.getDocumentList(request);
    }
}
