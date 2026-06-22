package com.web.app.service;

import com.web.app.domain.AuthenticationRequest;
import com.web.app.domain.AuthenticationResponse;

/**
 * 认证服务接口
 */
public interface AuthenticationService {
    
    /**
     * 用户认证
     * 
     * @param request 认证请求(包含username和password)
     * @return 认证响应(包含成功标志和完整用户信息)
     */
    AuthenticationResponse authenticate(AuthenticationRequest request);
}
