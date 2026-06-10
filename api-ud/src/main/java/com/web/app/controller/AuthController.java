package com.web.app.controller;

import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.service.AuthService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 认证 Controller
 */
@Api(tags = "AuthenticationApi", description = "用户信息的验证与管理")
@RestController
@RequestMapping("/api")
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * 用户登录
     *
     * @param request 登录请求
     * @return 登录响应
     */
    @ApiOperation(value = "用户登录", notes = "根据用户名和密码进行登录验证")
    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
