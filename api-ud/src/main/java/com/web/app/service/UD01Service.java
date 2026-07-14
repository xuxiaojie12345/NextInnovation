package com.web.app.service;

import com.web.app.domain.AuthenticationRequest;
import com.web.app.domain.AuthenticationResponse;

/**
 * UD01服务接口
 * 提供UD01AuthenticationApi接口 - 用户认证
 */
public interface UD01Service {
    
    /**
     * 用户认证
     * 
     * @param request 认证请求(包含username和password)
     * @return 认证响应(包含成功标志和完整用户信息)
     */
    AuthenticationResponse authenticate(AuthenticationRequest request);
}
