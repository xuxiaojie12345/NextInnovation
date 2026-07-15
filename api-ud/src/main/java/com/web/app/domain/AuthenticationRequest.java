package com.web.app.domain;

import java.io.Serializable;

/**
 * 认证请求DTO
 */
 /**

  * AuthenticationRequest

  */

public class AuthenticationRequest implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 用户名
     */
     /** username */

    private String username;
    
    /**
     * 密码
     */
     /** password */

    private String password;
    
    // Getter and Setter methods
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
}
