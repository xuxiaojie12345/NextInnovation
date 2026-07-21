package com.web.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthenticationResponse {
    private String userId;
    private String name;
    private String role;
    private String userName;
    private String responsible;
    private String userPosition;
    private String email;
}
