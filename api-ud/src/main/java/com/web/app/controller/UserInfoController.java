package com.web.app.controller;

import com.web.app.domain.LoginResponse;
import com.web.app.domain.Entity.UserInfo;
import com.web.app.domain.Login.LoginRequest;
import com.web.app.service.UserInfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class UserInfoController {

    @Autowired
    private UserInfoService userInfoService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {

        UserInfo user = userInfoService.login(request.getUserId(), request.getPassword());
        if (user != null) {
            return ResponseEntity.ok(LoginResponse.builder().success(true).message("Login successful").build());
        } else {
            return ResponseEntity.ok(LoginResponse.builder().success(false).message("Login failed").build());
        }
    }
}