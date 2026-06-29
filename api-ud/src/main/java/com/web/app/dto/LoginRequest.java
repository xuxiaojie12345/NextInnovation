package com.web.app.dto;

/**
 * 登录请求 DTO
 * 接收前端传入的用户ID和密码
 */
public class LoginRequest {

    /** 用户ID */
    private String userId;

    /** 密码 */
    private String password;

    public LoginRequest() {}

    public LoginRequest(String userId, String password) {
        this.userId = userId;
        this.password = password;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
