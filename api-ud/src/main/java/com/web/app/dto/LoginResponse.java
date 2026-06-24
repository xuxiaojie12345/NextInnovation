package com.web.app.dto;

import lombok.Data;

/**
 * 登录响应DTO
 * 对应API：UD01Authentication - /api/UD01/login
 * 
 * 响应数据结构（对应4.8节的data部分）：
 * {
 *     "token": "xxxx",
 *     "userId": "xxxx",
 *     "username": "xxx",
 *     "password": "xxx",
 *     "responsible": "xxx",
 *     "userPosition": "xxx",
 *     "email": "xxx"
 * }
 */
@Data
public class LoginResponse {
    
    /**
     * 认证Token（预留字段，后续可扩展JWT等认证机制）
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
     * 密码
     */
    private String password;
    
    /**
     * 担当
     */
    private String responsible;
    
    /**
     * 职位
     */
    private String userPosition;
    
    /**
     * 邮箱
     */
    private String email;
}
