package com.web.app.service;

import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;

/**
 * 登录服务接口
 */
public interface LoginService {
    
    /**
     * 用户登录
     */
    LoginResponse login(LoginRequest request);
}
