package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * 登录请求DTO
 */
@Data
public class LoginRequest implements Serializable {
    private static final long serialVersionUID = 1L;
    
    /**
     * 用户ID
     */
    private String userId;
    
    /**
     * 密码
     */
    private String password;
}
