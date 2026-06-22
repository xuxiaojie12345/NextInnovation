package com.web.app.service;

import com.web.app.dto.AuthenticationRequest;
import com.web.app.dto.AuthenticationResponse;

/**
 * 认证服务接口
 */
public interface AuthenticationService {
    
    /**
     * 用户认证
     * @param request 认证请求
     * @return 认证响应
     */
    AuthenticationResponse authentication(AuthenticationRequest request);
}
