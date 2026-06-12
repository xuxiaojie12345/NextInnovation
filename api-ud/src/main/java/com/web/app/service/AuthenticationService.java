package com.web.app.service;

import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;

public interface AuthenticationService {
    LoginResponse login(LoginRequest request);
}
