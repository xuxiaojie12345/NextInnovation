package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * UD20-1控制器 - UD20-1UpdateHdocDocumentList
 * POST /api/ud20-1/UpdateHdocDocumentList
 */
@RestController
@RequestMapping("/api/ud20-1")
/**

 * UD201Controller

 */

public class UD201Controller extends BaseController {@Autowired
    private com.web.app.service.UD201Service ud201Service;

    @PostMapping("/UpdateHdocDocumentList")
    /**

     * updateHdocDocumentList

     */

    public ApiResponse<String> updateHdocDocumentList(@RequestBody Map<String, String> request) {
        String operation = request.get("operation");
        logger.info("UD20-1UpdateHdocDocumentList called - operation: {}", operation);

        if (!"UPDATE_HDOC_DOCUMENT_LIST".equals(operation)) {
            return ApiResponse.error(400, "Unknown operation.");
        }

        String doctype = request.get("doctype");
        if (doctype == null || doctype.trim().isEmpty()) {
            return ApiResponse.error(400, "Document type不能为空");
        }

        try {
            String errorMsg = ud201Service.updateHdocDocumentList(doctype, request);
            if (errorMsg != null) {
                if (errorMsg.contains("does not exists")) {
                    return ApiResponse.notFound(errorMsg);
                }
                return ApiResponse.error(400, errorMsg);
            }
            return ApiResponse.success("更新成功");
        } catch (Exception e) {
            logger.error("UD20-1UpdateHdocDocumentList error", e);
            return ApiResponse.serverError();
        }
    }
}
