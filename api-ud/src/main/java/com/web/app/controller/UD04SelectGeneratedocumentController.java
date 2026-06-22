package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.GenerateDocumentData;
import com.web.app.service.UD04SelectGeneratedocumentService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD04生成文档控制器
 */
@RestController
@RequestMapping("/api/ud04")
@Api(tags = "UD04-生成文档管理")
public class UD04SelectGeneratedocumentController {

    private static final Logger logger = LogManager.getLogger(UD04SelectGeneratedocumentController.class);

    @Autowired
    private UD04SelectGeneratedocumentService ud04SelectGeneratedocumentService;

    /**
     * 获取生成文档所需的所有展示数据
     * 
     * @param request 请求参数（chassisSeries和chassisNo）
     * @return 统一响应对象，包含生成文档数据
     */
    @GetMapping("/generatedocument")
    @ApiOperation(value = "获取生成文档数据", notes = "根据底盘号获取VIN Plate文档生成结果及相关车辆信息")
    public ApiResponse<GenerateDocumentData> getGenerateDocument(
            @RequestParam("chassisSeries") String chassisSeries,
            @RequestParam("chassisNo") String chassisNo) {
        logger.info("接收到获取生成文档数据请求，chassisSeries: {}, chassisNo: {}", 
                chassisSeries, chassisNo);

        try {
            // 参数校验
            if (chassisSeries == null || chassisSeries.trim().isEmpty()) {
                return ApiResponse.error("Chassis series is required");
            }
            if (chassisNo == null || chassisNo.trim().isEmpty()) {
                return ApiResponse.error("Chassis no is required");
            }

            // 调用服务层获取生成文档数据
            GenerateDocumentData documentData = ud04SelectGeneratedocumentService.getGenerateDocumentData(
                    chassisSeries.trim(), 
                    chassisNo.trim());

            logger.info("生成文档数据获取成功，orderNumber: {}", documentData.getOrderNumber());
            
            // 返回成功响应
            return ApiResponse.success("Success", documentData);
        } catch (Exception e) {
            logger.error("获取生成文档数据失败", e);
            return ApiResponse.error(e.getMessage());
        }
    }
}
