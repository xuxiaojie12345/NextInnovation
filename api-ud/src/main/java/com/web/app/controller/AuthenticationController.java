package com.web.app.controller;

import com.web.app.dto.CommonResponse;
import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.service.LoginService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 认证API控制器
 */
@RestController
@RequestMapping("/api/AuthenticationApi")
@Api(tags = "认证API")
public class AuthenticationController {
    
    @Autowired
    private LoginService loginService;
    
    @PostMapping("/login")
    @ApiOperation("用户登录")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return loginService.login(request);
    }
}
