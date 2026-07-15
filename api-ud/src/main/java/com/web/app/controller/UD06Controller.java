package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.ModifyDocumentUpdateRequest;
import com.web.app.domain.SaveModificationsQueryResponse;
import com.web.app.service.UD06Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * UD06控制器
 * 提供UD06SaveModificationsApi接口 - ADCA修改信息查询
 * 对应详细设计：DES-SaveModifications-001
 *
 * 接口列表：
 * 1. POST /api/ud06/savemodifications/query - 查询ADCA修改信息
 */
@RestController
@RequestMapping("/api/ud06")
/**

 * UD06Controller

 */

public class UD06Controller {

    private static final Logger logger = LoggerFactory.getLogger(UD06Controller.class);

    @Autowired
    /** ud06Service */

    private UD06Service ud06Service;

    /**
     * UD06SelectHdocAdcaModification
     * 根据底盘号查询ADCA修改信息
     *
     * @param request 请求参数（serie、chno）
     * @return ADCA修改信息
     */
    @PostMapping("/savemodifications/query")
    public ApiResponse<SaveModificationsQueryResponse> selectHdocAdcaModification(
            @RequestBody ModifyDocumentUpdateRequest request) {

        logger.info("UD06SelectHdocAdcaModification called - serie: {}, chno: {}",
                request.getSerie(), request.getChno());

        // 参数非空校验
        if (request.getChno() == null || request.getChno().trim().isEmpty()) {
            return ApiResponse.notFound("未找到修改记录");
        }

        try {
            SaveModificationsQueryResponse response = ud06Service.selectHdocAdcaModification(
                    request.getSerie(), request.getChno());

            if (response == null) {
                logger.warn("No modification records found for chno: {}", request.getChno());
                return ApiResponse.notFound("未找到修改记录");
            }

            logger.info("UD06 query success for chno: {}", request.getChno());
            return ApiResponse.success(response);

        } catch (Exception e) {
            logger.error("UD06 query error for chno: " + request.getChno(), e);
            return ApiResponse.serverError();
        }
    }
}
