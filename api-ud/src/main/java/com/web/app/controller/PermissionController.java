package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.response.PermissionResponse;
import com.web.app.service.FunctionAuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class PermissionController {

    @Autowired
    private FunctionAuthService functionAuthService;

    @GetMapping("/GetUserFunctionAuth")
    public ApiResponse<PermissionResponse> getUserFunctionAuth(@RequestHeader("userId") String userId) {
        PermissionResponse resp = functionAuthService.getUserFunctionAuth(userId);
        return ApiResponse.success(resp);
    }
}
