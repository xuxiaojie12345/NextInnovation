package com.web.app.controller;

import com.web.app.domain.ApiResponse;
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

    /**
     * 根据用户ID获取用户信息
     * @param userId 用户ID（URL路径参数）
     * @return 用户信息
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<UserInfo>> getUserById(@PathVariable String userId) {
        try {
            UserInfo user = userInfoService.getUserById(userId);
            if (user != null) {
                // 不返回密码
                user.setPassword(null);
                return ResponseEntity.ok(ApiResponse.success("获取用户信息成功", user));
            } else {
                return ResponseEntity.ok(ApiResponse.error(404, "未找到该用户信息"));
            }
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error(500, "获取用户信息失败"));
        }
    }
}