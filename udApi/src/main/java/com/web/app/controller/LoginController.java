package com.web.app.controller;

import com.web.app.domain.LoginRequest;
import com.web.app.domain.LoginResponse;
import com.web.app.service.UserService;
import com.web.app.tool.Result;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * 登录控制器
 */
@Api(tags = "用户登录接口")
@RestController
@RequestMapping("/api/auth")
public class LoginController {

    private static final Logger logger = LogManager.getLogger(LoginController.class);

    @Autowired
    private UserService userService;

    /**
     * 用户登录
     * @param loginRequest 登录请求
     * @return 登录结果
     */
    @ApiOperation(value = "用户登录", notes = "验证用户名和密码，返回Token")
    @PostMapping("/login")
    public Result<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        try {
            LoginResponse response = userService.login(loginRequest);
            return Result.success("登录成功", response);
        } catch (RuntimeException e) {
            logger.error("登录失败: {}", e.getMessage());
            return Result.error(e.getMessage());
        } catch (Exception e) {
            logger.error("登录异常: {}", e.getMessage(), e);
            return Result.error("系统异常，请稍后重试");
        }
    }

    /**
     * 健康检查接口
     * @return 健康状态
     */
    @ApiOperation(value = "健康检查", notes = "检查服务是否正常运行")
    @GetMapping("/health")
    public Result<String> health() {
        return Result.success("服务正常运行");
    }
}
