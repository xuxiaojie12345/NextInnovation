package com.web.app.service.impl;

import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.entity.HdocUserInfor;
import com.web.app.mapper.LoginMapper;
import com.web.app.service.LoginService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * 登录业务逻辑实现
 *
 * 核心逻辑：
 * - 对请求参数进行非空校验
 * - 通过 LoginMapper 查询数据库中的用户信息
 * - 若检索到数据则登录成功，生成Token并返回
 * - 若检索不到则登录失败，返回失败信息
 */
@Service
public class LoginServiceImpl implements LoginService {

    private static final Logger logger = LogManager.getLogger(LoginServiceImpl.class);

    @Autowired
    private LoginMapper loginMapper;

    @Override
    public LoginResponse login(LoginRequest request) {
        // 参数非空校验
        if (request == null) {
            logger.warn("Login request is null");
            return LoginResponse.fail("Username and password are required.");
        }

        String userId = request.getUserId();
        String password = request.getPassword();

        if (userId == null || userId.trim().isEmpty()) {
            logger.warn("User ID is empty");
            return LoginResponse.fail("Username and password are required.");
        }

        if (password == null || password.trim().isEmpty()) {
            logger.warn("Password is empty");
            return LoginResponse.fail("Username and password are required.");
        }

        try {
            // 根据用户ID和密码查询数据库
            HdocUserInfor user = loginMapper.findByUserIdAndPassword(userId.trim(), password.trim());

            if (user != null) {
                // 登录成功：生成Token、构建成功响应
                String token = generateToken(userId.trim());
                logger.info("User {} logged in successfully", userId);

                return LoginResponse.success(token, user.getUserid(), user.getUsername());
            } else {
                // 登录失败：未检索到用户信息
                logger.warn("Login failed for user {}: invalid credentials", userId);
                return LoginResponse.fail("We didn't recognize the username or password you entered. Please try again.");
            }
        } catch (Exception e) {
            logger.error("Error during login for user {}: {}", userId, e.getMessage());
            return LoginResponse.fail("System error. Please contact administrator.");
        }
    }

    /**
     * 生成Token（包含用户ID等）
     * @param userId 用户ID
     * @return 生成的Token字符串
     */
    private String generateToken(String userId) {
        // 使用UUID + 用户ID生成简单Token
        return UUID.randomUUID().toString().replace("-", "") + "_" + userId;
    }
}
