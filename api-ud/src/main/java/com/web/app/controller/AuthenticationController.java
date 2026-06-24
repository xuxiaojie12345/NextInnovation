package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.service.AuthenticationService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器
 * 
 * @description 处理用户登录认证相关的HTTP请求
 */
@Api(tags = "认证管理")
@RestController
@RequestMapping("/api/authentication")
public class AuthenticationController {

    @Autowired
    private AuthenticationService authenticationService;

    /**
     * 用户登录
     * 
     * @param loginRequest 登录请求对象
     * @return 统一响应对象，包含登录结果
     */
    @ApiOperation(value = "用户登录", notes = "用户通过用户名和密码进行登录")
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Validated @RequestBody LoginRequest loginRequest) {
        // 调用业务逻辑层处理登录请求
        LoginResponse response = authenticationService.login(loginRequest);

        // 返回成功响应
        return ApiResponse.success("登录成功", response);
    }
}
