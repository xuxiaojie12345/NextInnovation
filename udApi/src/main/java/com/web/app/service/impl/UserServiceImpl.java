package com.web.app.service.impl;

import com.web.app.domain.LoginRequest;
import com.web.app.domain.LoginResponse;
import com.web.app.domain.User;
import com.web.app.mapper.UserMapper;
import com.web.app.service.UserService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * 用户服务实现类
 */
@Service
public class UserServiceImpl implements UserService {

    private static final Logger logger = LogManager.getLogger(UserServiceImpl.class);

    @Autowired
    private UserMapper userMapper;

    /**
     * 用户登录
     * @param loginRequest 登录请求
     * @return 登录响应
     */
    @Override
    public LoginResponse login(LoginRequest loginRequest) {
        String username = loginRequest.getUsername();
        String password = loginRequest.getPassword();

        // 参数验证
        if (username == null || username.trim().isEmpty()) {
            throw new RuntimeException("用户名不能为空");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new RuntimeException("密码不能为空");
        }

        logger.info("用户登录请求，用户名: {}", username);

        // 1. 根据用户名查询用户
        User user = userMapper.findByUsername(username);

        // 2. 验证用户是否存在
        if (user == null) {
            logger.warn("用户不存在，用户名: {}", username);
            throw new RuntimeException("用户名或密码错误");
        }

        // 3. 验证用户状态
        if (user.getStatus() != null && user.getStatus() == 0) {
            logger.warn("用户已被禁用，用户名: {}", username);
            throw new RuntimeException("账号已被禁用，请联系管理员");
        }

        // 4. 验证密码（使用MD5加密比对）
        String encryptedPassword = encryptPassword(password);
        if (!encryptedPassword.equals(user.getPassword())) {
            logger.warn("密码错误，用户名: {}", username);
            throw new RuntimeException("用户名或密码错误");
        }

        // 5. 生成Token（简单实现，实际项目建议使用JWT）
        String token = generateToken();

        logger.info("用户登录成功，用户名: {}", username);

        // 6. 构建响应对象
        LoginResponse response = new LoginResponse();
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setRealName(user.getRealName());
        response.setToken(token);

        return response;
    }

    /**
     * 密码加密（MD5）
     * @param password 原始密码
     * @return 加密后的密码
     */
    private String encryptPassword(String password) {
        return DigestUtils.md5DigestAsHex(password.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 生成Token（UUID简单实现）
     * @return Token字符串
     */
    private String generateToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
