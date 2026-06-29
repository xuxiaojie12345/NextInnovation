package com.web.app.controller;

import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.service.LoginService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 登录控制器
 *
 * 提供接口：
 * - GET /login 用户登录（兼容前端 GET 请求）
 *
 * 返回统一格式：
 * {
 *     "code": 200,
 *     "message": "success",
 *     "data": {
 *         "token": "xxxx",
 *         "userId": "取得的userID",
 *         "username": "xxx"
 *     }
 * }
 */
@Api(tags = "Authentication - 用户认证")
@RestController
public class LoginController {

    private static final Logger logger = LogManager.getLogger(LoginController.class);

    @Autowired
    private LoginService loginService;

    /**
     * 用户登录
     * 对应前端 Login.tsx 的调用：axios.get('/login', { params: { userId, password } })
     *
     * @param userId 用户ID
     * @param password 密码
     * @return 登录响应（含Token、用户信息等）
     */
    @ApiOperation("用户登录")
    @GetMapping("/login")
    public LoginResponse login(
            @RequestParam("userId") String userId,
            @RequestParam("password") String password) {
        logger.info("Received login request for user: {}", userId);

        LoginRequest request = new LoginRequest(userId, password);
        return loginService.login(request);
    }
}
