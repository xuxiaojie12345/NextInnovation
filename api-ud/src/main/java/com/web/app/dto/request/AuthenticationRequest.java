package com.web.app.dto.request;

import lombok.Data;

@Data
public class AuthenticationRequest {
    private String userId;
    private String password;
    // needPassword=true（默认，Login 使用）要求 userId+password；
    // needPassword=false（UserView/EDB User View 使用）仅按 userId 查询用户信息
    private Boolean needPassword = Boolean.TRUE;
}
