package com.web.app.service;

import com.web.app.domain.UserInfo;

/**
 * 认证服务接口
 */
public interface AuthenticationService {

    /**
     * 用户登录
     * 
     * @param userId 用户ID
     * @param password 密码
     * @return 用户信息对象
     */
    UserInfo login(String userId, String password);
}
