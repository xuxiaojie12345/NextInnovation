package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD25UserInfoResponse;
import com.web.app.service.UD25Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * UD25控制器 - UD25AuthenticationApi
 * 对应详细设计：详细设计/詳細設計UD25.md
 *
 * 功能说明：
 * 客户端通过GET请求访问接口 /api/authentication/userinfo，
 * 将Userid作为请求参数发送至后端服务。
 * 根据Userid从HDOC_USER_INFOR表检索Userid、Responsible、User Position、E-mail。
 */
@RestController
@RequestMapping("/api/authentication")
public class UD25Controller {

    private static final Logger logger = LoggerFactory.getLogger(UD25Controller.class);

    @Autowired
    private UD25Service ud25Service;

    /**
     * UD25AuthenticationApi - 获取用户详细信息
     *
     * @param userId 用户ID（请求参数）
     * @return 用户详细信息（userid、responsible、userPosition、email）
     */
    @GetMapping("/userinfo")
    public ApiResponse<UD25UserInfoResponse> getUserInfo(
            @RequestParam(value = "userId", required = false) String userId) {

        logger.info("UD25AuthenticationApi called - userId: {}", userId);

        // 参数非空校验
        if (userId == null || userId.trim().isEmpty()) {
            // 如果前端未传userId,尝试从登录session中获取当前用户信息
            // 对应全体APIのプロンプト.txt 4.1
            return ApiResponse.error(400, "User ID is required.");
        }

        try {
            UD25UserInfoResponse response = ud25Service.getUserInfo(userId.trim());

            if (response == null) {
                logger.warn("User not found: {}", userId);
                return ApiResponse.notFound("User not found.");
            }

            logger.info("UD25 query success for userId: {}", userId);
            return ApiResponse.success(response);

        } catch (Exception e) {
            logger.error("UD25 query error for userId: " + userId, e);
            return ApiResponse.serverError();
        }
    }
}
