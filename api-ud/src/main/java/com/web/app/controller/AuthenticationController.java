package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.request.AuthenticationRequest;
import com.web.app.dto.response.AuthenticationResponse;
import com.web.app.service.AuthenticationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AuthenticationController {

    @Autowired
    private AuthenticationService authenticationService;

    @PostMapping("/authentication")
    public ApiResponse<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
        AuthenticationResponse resp = authenticationService.authenticate(request);
        return ApiResponse.success(resp);
    }
}
