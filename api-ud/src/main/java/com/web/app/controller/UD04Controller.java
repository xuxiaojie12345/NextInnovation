package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.GenerateDocumentQueryRequest;
import com.web.app.domain.GenerateDocumentQueryResponse;
import com.web.app.service.UD04Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * UD04控制器
 * 提供UD04SelectGeneratedocumentApi接口 - 根据底盘号查询文档信息
 * 对应详细设计：DES-GenerateDocumentPage-001
 */
@RestController
@RequestMapping("/api/ud04")
/**

 * UD04Controller

 */

public class UD04Controller {

    private static final Logger logger = LoggerFactory.getLogger(UD04Controller.class);

    @Autowired
    /** ud04Service */

    private UD04Service ud04Service;

    /**
     * UD04SelectGeneratedocumentApi
     * 根据底盘号查询并返回所有相关的文档信息和数据
     *
     * @param request 请求体，包含chassisSeries、chassisNo、documentType
     * @return 底盘文档信息
     */
    @PostMapping("/selectgenerateddocument")
    public ApiResponse<GenerateDocumentQueryResponse> selectGeneratedDocument(
            @RequestBody GenerateDocumentQueryRequest request) {

        String chassisSeries = request.getChassisSeries();
        String chassisNo = request.getChassisNo();
        String documentType = request.getDocumentType();

        logger.info("UD04SelectGeneratedocumentApi called - chassisSeries: {}, chassisNo: {}, documentType: {}",
                chassisSeries, chassisNo, documentType);

        // 参数非空校验
        if (chassisNo == null || chassisNo.trim().isEmpty()) {
            return ApiResponse.notFound("Chassis not found");
        }

        try {
            GenerateDocumentQueryResponse response = ud04Service.selectGeneratedDocument(chassisSeries, chassisNo, documentType);
            
            if (response == null) {
                logger.warn("Chassis not found: {}", chassisNo);
                return ApiResponse.notFound("Chassis not found");
            }

            logger.info("UD04 query success for chassisNo: {}", chassisNo);
            return ApiResponse.success(response);

        } catch (Exception e) {
            logger.error("UD04 query error for chassisNo: " + chassisNo, e);
            return ApiResponse.serverError();
        }
    }
}
