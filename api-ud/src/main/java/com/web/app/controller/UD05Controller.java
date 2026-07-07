package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.ModifyDocumentQueryResponse;
import com.web.app.domain.ModifyDocumentUpdateRequest;
import com.web.app.service.UD05Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * UD05控制器
 * 提供UD05ModifyDocumentApi接口 - 文档变量修改与保存
 * 对应详细设计：DES-ModifyDocument-001
 *
 * 接口列表：
 * 1. POST /api/ud05/modifydocument/query - 查询变量列表
 * 2. POST /api/ud05/modifydocument/update - 更新变量值
 */
@RestController
@RequestMapping("/api/ud05")
public class UD05Controller {

    private static final Logger logger = LoggerFactory.getLogger(UD05Controller.class);

    @Autowired
    private UD05Service ud05Service;

    /**
     * UD05SelectVariableModification
     * 根据底盘号查询变量修改信息
     *
     * @param request 请求参数（serie、chno）
     * @return 变量修改信息
     */
    @PostMapping("/modifydocument/query")
    public ApiResponse<ModifyDocumentQueryResponse> selectVariableModification(
            @RequestBody ModifyDocumentUpdateRequest request) {

        logger.info("UD05SelectVariableModification called - serie: {}, chno: {}",
                request.getSerie(), request.getChno());

        // 参数非空校验
        if (request.getChno() == null || request.getChno().trim().isEmpty()) {
            return ApiResponse.notFound("未找到该底盘的修改记录");
        }

        try {
            ModifyDocumentQueryResponse response = ud05Service.selectVariableModification(
                    request.getSerie(), request.getChno());

            if (response == null || response.getVariables() == null || response.getVariables().isEmpty()) {
                logger.warn("No modification records found for chno: {}", request.getChno());
                return ApiResponse.notFound("未找到该底盘的修改记录");
            }

            logger.info("UD05 query success for chno: {}", request.getChno());
            return ApiResponse.success(response);

        } catch (Exception e) {
            logger.error("UD05 query error for chno: " + request.getChno(), e);
            return ApiResponse.serverError();
        }
    }

    /**
     * UD05UpdateHdocAdcaModification
     * 更新HDOC_ADCA_MODIFICATION表的NEWVAL字段
     *
     * @param request 请求参数（serie、chno、variable、modifiedValue）
     * @return 操作结果
     */
    @PostMapping("/modifydocument/update")
    public ApiResponse<String> updateHdocAdcaModification(
            @RequestBody ModifyDocumentUpdateRequest request) {

        logger.info("UD05UpdateHdocAdcaModification called - serie: {}, chno: {}, variable: {}",
                request.getSerie(), request.getChno(), request.getVariable());

        // 参数非空校验
        if (request.getChno() == null || request.getChno().trim().isEmpty()) {
            return ApiResponse.error(400, "参数异常：底盘编号不能为空");
        }
        if (request.getVariable() == null || request.getVariable().trim().isEmpty()) {
            return ApiResponse.error(400, "参数异常：变量名不能为空");
        }

        try {
            boolean success = ud05Service.updateHdocAdcaModification(
                    request.getSerie(),
                    request.getChno(),
                    request.getVariable(),
                    request.getModifiedValue(),
                    request.getUpdateUser());

            if (success) {
                logger.info("UD05 update success for chno: {}, variable: {}", request.getChno(), request.getVariable());
                return ApiResponse.success("更新成功");
            } else {
                logger.warn("UD05 update - no record found for chno: {}, variable: {}", request.getChno(), request.getVariable());
                return ApiResponse.notFound("未找到对应的修改记录");
            }

        } catch (Exception e) {
            logger.error("UD05 update error for chno: " + request.getChno() + ", variable: " + request.getVariable(), e);
            return ApiResponse.serverError();
        }
    }
}
