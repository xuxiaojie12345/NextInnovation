package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD19Request;
import com.web.app.service.UD19Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ud19")
/**

 * UD19Controller

 */

public class UD19Controller {

    private static final Logger logger = LoggerFactory.getLogger(UD19Controller.class);

    @Autowired
    /** ud19Service */

    private UD19Service ud19Service;

    @PostMapping("/UD19SearchResultListApi")
    /**

     * searchUser

     */

    public ApiResponse<Map<String, Object>> searchUser(@RequestBody UD19Request request) {
        logger.info("UD19 called - operation: {}", request.getOperation());
        try {
            return ApiResponse.success(ud19Service.searchUser(request));
        } catch (Exception e) {
            logger.error("UD19 error", e);
            return ApiResponse.serverError();
        }
    }
}
