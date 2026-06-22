package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc")
@CrossOrigin(origins = "*")
public class LoginController {
    
    @Autowired
    private UserService userService;
    
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse.LoginData>> login(@RequestBody LoginRequest request) {
        try {
            // 验证请求参数
            if (request.getUserid() == null || request.getUserid().trim().isEmpty() ||
                request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(401, "Username and password are required."));
            }
            
            // 认证用户
            LoginResponse.LoginData loginData = userService.authenticate(request);
            
            if (loginData != null) {
                return ResponseEntity.ok(ApiResponse.success(loginData));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(401, "We didn't recognize the username or password you entered. Please try again."));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(500, "System error. Please contact administrator."));
        }
    }
}