package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD18Request;
import com.web.app.service.UD18Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ud18")
/**

 * UD18Controller

 */

public class UD18Controller extends BaseController {@Autowired
    /** ud18Service */

    private UD18Service ud18Service;

    @PostMapping("/UD18HDocUserDocAdministrationApi")
    /**

     * processUserDoc

     */

    public ApiResponse<Map<String, Object>> processUserDoc(@RequestBody UD18Request request) {
        logger.info("UD18 called - operation: {}, userid: {}", request.getOperation(), request.getUserid());
        if (request.getUserid() == null || request.getUserid().trim().isEmpty()) {
            return ApiResponse.error(400, "User ID is required.");
        }
        try {
            return ApiResponse.success(ud18Service.processUserDoc(request));
        } catch (Exception e) {
            logger.error("UD18 error", e);
            return ApiResponse.serverError();
        }
    }
}
