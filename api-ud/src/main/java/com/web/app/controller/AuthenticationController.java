package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UserInfo;
import com.web.app.service.AuthenticationService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;

/**
 * 认证控制器
 */
@RestController
@RequestMapping("/api/authentication")
@Api(tags = "认证管理API")
public class AuthenticationController {

    private static final Logger logger = LogManager.getLogger(AuthenticationController.class);

    @Autowired
    private AuthenticationService authenticationService;

    /**
     * 用户登录接口（GET方式）
     * 
     * @param userId 用户ID
     * @param password 密码
     * @param session HTTP会话对象
     * @return 统一响应对象
     */
    @GetMapping("/login")
    @ApiOperation(value = "用户登录", notes = "通过用户ID和密码进行登录验证，并将用户信息保存到Session中")
    public ApiResponse<UserInfo> login(
            @RequestParam String userId,
            @RequestParam String password,
            HttpSession session) {
        logger.info("接收到登录请求（GET），userId: {}", userId);

        try {
            // 调用服务层处理登录逻辑
            UserInfo userInfo = authenticationService.login(userId, password);

            // 将用户信息保存到Session中
            session.setAttribute("userInfo", userInfo);
            session.setAttribute("userId", userInfo.getUserid());
            session.setAttribute("userName", userInfo.getUsername());
            session.setAttribute("responsible", userInfo.getResponsible());
            session.setAttribute("userPosition", userInfo.getUserposition());
            session.setAttribute("email", userInfo.getEmail());

            logger.info("用户信息已保存到Session，userId: {}, userName: {}", 
                    userInfo.getUserid(), userInfo.getUsername());

            // 返回成功响应，包含完整的用户信息
            return ApiResponse.success("登录成功", userInfo);
        } catch (RuntimeException e) {
            logger.error("登录失败: {}", e.getMessage());
            // 返回失败响应
            return ApiResponse.error(401, e.getMessage());
        } catch (Exception e) {
            logger.error("系统异常: {}", e.getMessage(), e);
            // 返回系统异常响应
            return ApiResponse.error(500, "系统异常，请稍后重试");
        }
    }
}
