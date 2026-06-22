package com.web.app.domain;

import lombok.Data;
import java.io.Serializable;

/**
 * 登录请求对象
 */
@Data
public class AuthenticationRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    private String userId;      // 用户ID
    private String password;    // 密码
}
