package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.GeneratedDocumentDto;
import com.web.app.service.UD04SelectGeneratedocumentService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * UD04 Controller - 提供生成文档数据查询
 */
@Api(tags = "UD04 - Generated Document")
@RestController
@RequestMapping("/api/ud04")
public class UD04SelectGeneratedocumentController {

    @Autowired
    private UD04SelectGeneratedocumentService ud04Service;

    @ApiOperation(value = "获取生成文档数据", notes = "根据底盘系列和底盘编号获取 UD04 画面所需的数据")
    @GetMapping("/selectgenerateddocument")
    public ApiResponse<GeneratedDocumentDto> selectGeneratedDocument(
            @RequestParam("chassisSeries") String chassisSeries,
            @RequestParam("chassisNo") String chassisNo) {

        if (chassisSeries == null || chassisSeries.trim().isEmpty() || chassisNo == null || chassisNo.trim().isEmpty()) {
            return ApiResponse.error(400, "缺少必要参数 chassisSeries 或 chassisNo", "PARAM_ERROR");
        }

        GeneratedDocumentDto document = ud04Service.selectGeneratedDocument(chassisSeries.trim(), chassisNo.trim());
        if (document == null) {
            return ApiResponse.error(404, "未找到对应的生成文档数据", "DATA_NOT_FOUND");
        }

        return ApiResponse.success(document);
    }
}
