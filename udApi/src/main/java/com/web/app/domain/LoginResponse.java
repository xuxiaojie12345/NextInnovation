package com.web.app.domain;

import lombok.Data;
import java.io.Serializable;

/**
 * 登录响应DTO
 */
@Data
public class LoginResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 用户名
     */
    private String username;

    /**
     * 真实姓名
     */
    private String realName;

    /**
     * Token（可用于后续的身份验证）
     */
    private String token;

    public LoginResponse() {
    }

    public LoginResponse(Long userId, String username, String realName, String token) {
        this.userId = userId;
        this.username = username;
        this.realName = realName;
        this.token = token;
    }
}
