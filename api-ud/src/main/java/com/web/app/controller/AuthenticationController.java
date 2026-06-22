package com.web.app.controller;

import com.web.app.dto.AuthenticationRequest;
import com.web.app.dto.AuthenticationResponse;
import com.web.app.service.AuthenticationService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/ud01")
@Api(tags = "用户认证管理")
public class AuthenticationController {
    
    @Autowired
    private AuthenticationService authenticationService;
    
    /**
     * 用户认证接口
     * @param userId 用户ID
     * @param password 密码
     * @return 认证响应
     */
    @GetMapping("/authentication")
    @ApiOperation(value = "用户登录认证", notes = "验证用户身份并返回用户信息和Token")
    public AuthenticationResponse authentication(
            @RequestParam String userId,
            @RequestParam(required = false) String password) {
        log.info("收到登录请求: userId={}", userId);
        
        // 构建请求对象
        AuthenticationRequest request = new AuthenticationRequest();
        request.setUserId(userId);
        request.setPassword(password);
        
        return authenticationService.authentication(request);
    }
}
