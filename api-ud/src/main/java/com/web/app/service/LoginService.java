package com.web.app.service;

import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;

/**
 * 登录业务逻辑接口
 * 定义用户认证相关方法
 */
public interface LoginService {

    /**
     * 用户登录
     * @param request 登录请求（含用户ID和密码）
     * @return 登录响应（含Token、用户信息等）
     */
    LoginResponse login(LoginRequest request);
}
