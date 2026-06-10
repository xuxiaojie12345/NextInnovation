package com.web.app.service;

import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;

/**
 * 认证服务接口
 */
public interface AuthService {

    /**
     * 用户登录
     *
     * @param request 登录请求
     * @return 登录响应
     */
    LoginResponse login(LoginRequest request);
}
