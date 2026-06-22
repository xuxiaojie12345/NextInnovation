package com.web.app.dto;

import lombok.Data;

@Data
public class LoginResponse {
    private int code;
    private String msg;
    private LoginData data;
    
    @Data
    public static class LoginData {
        private String token;
        private String userId;
        private String username;
    }
}