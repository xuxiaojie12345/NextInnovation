package com.web.app.domain;

import lombok.Data;
import java.io.Serializable;

/**
 * 登录响应数据对象
 */
@Data
public class LoginResponseData implements Serializable {
    private static final long serialVersionUID = 1L;

    private String token;       // Token
    private String userId;      // 用户ID
    private String username;    // 用户名
}
