package com.web.app.service;

import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;

/**
 * 认证服务接口
 * 
 * @description 提供用户登录认证相关的业务逻辑
 */
public interface AuthenticationService {
    
    /**
     * 用户登录
     * 
     * @param loginRequest 登录请求对象
     * @return 登录响应对象
     */
    LoginResponse login(LoginRequest loginRequest);
}
