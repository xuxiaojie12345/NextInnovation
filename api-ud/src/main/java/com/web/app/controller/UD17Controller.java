package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD17Request;
import com.web.app.service.UD17Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ud17")
public class UD17Controller {

    private static final Logger logger = LoggerFactory.getLogger(UD17Controller.class);

    @Autowired
    private UD17Service ud17Service;

    @GetMapping("/markets")
    public ApiResponse<List<Map<String, String>>> getMarkets() {
        logger.info("UD17 getMarkets called");
        try {
            return ApiResponse.success(ud17Service.getMarkets());
        } catch (Exception e) {
            logger.error("UD17 getMarkets error", e);
            return ApiResponse.serverError();
        }
    }

    @PostMapping("/UD17HDocUserAdministrationApi")
    public ApiResponse<Map<String, Object>> processUserAdmin(@RequestBody UD17Request request) {
        logger.info("UD17 processUserAdmin called - operation: {}, userid: {}", request.getOperation(), request.getUserid());
        if (request.getUserid() == null || request.getUserid().trim().isEmpty()) {
            return ApiResponse.error(400, "User ID is required.");
        }
        try {
            return ApiResponse.success(ud17Service.processUserAdmin(request));
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(400, e.getMessage());
        } catch (Exception e) {
            logger.error("UD17 processUserAdmin error", e);
            return ApiResponse.serverError();
        }
    }
}
