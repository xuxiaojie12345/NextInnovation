package com.web.app.domain.Login;

import lombok.Data;

@Data
public class LoginRequest {

    private String userId;

    private String password;
}