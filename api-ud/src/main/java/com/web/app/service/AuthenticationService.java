package com.web.app.service;

import com.web.app.dto.request.AuthenticationRequest;
import com.web.app.dto.response.AuthenticationResponse;

public interface AuthenticationService {
    AuthenticationResponse authenticate(AuthenticationRequest request);
}
