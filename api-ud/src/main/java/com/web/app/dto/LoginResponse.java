package com.web.app.dto;

import lombok.Data;

/**
 * 登录响应对象
 * 
 * @description 用户登录成功后的响应数据
 */
@Data
public class LoginResponse {
    
    /**
     * 访问令牌
     */
    private String token;
    
    /**
     * 用户ID
     */
    private String userId;
    
    /**
     * 用户名
     */
    private String username;
    
    /**
     * 用户角色
     */
    private String role;
    
    /**
     * 登录时间
     */
    private String loginTime;
    
    /**
     * 构造器
     * 
     * @param token 访问令牌
     * @param userId 用户ID
     * @param username 用户名
     * @param role 用户角色
     * @param loginTime 登录时间
     */
    public LoginResponse(String token, String userId, String username, String role, String loginTime) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.loginTime = loginTime;
    }
}
