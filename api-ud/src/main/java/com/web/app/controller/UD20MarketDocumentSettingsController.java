package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD20MarketDocumentSettingsService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * UD20_MarketDocumentSettings 控制器
 * 提供文档信息更新接口
 */
@RestController
@RequestMapping("/api/marketdocumentsettings")
@Api(tags = "UD20-市场文档设置")
public class UD20MarketDocumentSettingsController {

    private static final Logger logger = LogManager.getLogger(UD20MarketDocumentSettingsController.class);

    @Autowired
    private UD20MarketDocumentSettingsService ud20MarketDocumentSettingsService;

    /**
     * 更新文档信息
     *
     * @param params 请求参数（包含documentType, businessUnit, user, date）
     * @return 统一响应对象
     */
    @PostMapping("/update")
    @ApiOperation(value = "更新文档信息", notes = "更新HDOC_DOCUMENT_LIST表中的文档设置信息")
    public ApiResponse<Map<String, Object>> updateDocument(@RequestBody Map<String, Object> params) {

        logger.info("接收到更新文档信息请求");

        try {
            String documentType = (String) params.get("documentType");
            if (documentType == null || documentType.trim().isEmpty()) {
                return ApiResponse.error("Document type is required");
            }

            Map<String, Object> data = ud20MarketDocumentSettingsService.updateDocument(params);
            return ApiResponse.success("更新成功", data);
        } catch (Exception e) {
            logger.error("更新文档信息失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }
}
