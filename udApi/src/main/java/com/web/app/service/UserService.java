package com.web.app.service;

import com.web.app.domain.LoginRequest;
import com.web.app.domain.LoginResponse;

/**
 * 用户服务接口
 */
public interface UserService {

    /**
     * 用户登录
     * @param loginRequest 登录请求
     * @return 登录响应（包含Token）
     */
    LoginResponse login(LoginRequest loginRequest);
}
