package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD20Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * UD20控制器 - UD20GetDocumentListApi
 * GET /api/ud20/marketdocumentsettings
 */
@RestController
@RequestMapping("/api/ud20")
public class UD20Controller {

    private static final Logger logger = LoggerFactory.getLogger(UD20Controller.class);

    @Autowired
    private UD20Service ud20Service;

    @GetMapping("/marketdocumentsettings")
    public ApiResponse<List<Map<String, Object>>> getDocumentList(
            @RequestParam(required = false) String documentType) {
        logger.info("UD20GetDocumentListApi called - documentType: {}", documentType);
        try {
            return ApiResponse.success(ud20Service.getDocumentList(documentType));
        } catch (Exception e) {
            logger.error("UD20GetDocumentListApi error", e);
            return ApiResponse.serverError();
        }
    }
}
