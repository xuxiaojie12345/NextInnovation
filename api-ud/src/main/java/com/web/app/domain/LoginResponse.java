package com.web.app.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private boolean success;
    private String message;
    private LoginData data;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginData {
        private String userId;
    }
}