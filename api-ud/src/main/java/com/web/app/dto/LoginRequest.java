package com.web.app.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String userid;
    private String password;
}