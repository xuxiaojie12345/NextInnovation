package com.web.app.service.impl;

import com.web.app.domain.UserInfo;
import com.web.app.mapper.UserMapper;
import com.web.app.service.AuthenticationService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * 认证服务实现类
 */
@Service
public class AuthenticationServiceImpl implements AuthenticationService {

    private static final Logger logger = LogManager.getLogger(AuthenticationServiceImpl.class);

    @Autowired
    private UserMapper userMapper;

    /**
     * 用户登录
     * 
     * @param userId 用户ID
     * @param password 密码
     * @return 用户信息对象
     */
    @Override
    public UserInfo login(String userId, String password) {
        logger.info("开始处理登录请求，userId: {}", userId);

        // 1. 参数校验
        if (userId == null || userId.trim().isEmpty()) {
            throw new RuntimeException("用户ID不能为空");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new RuntimeException("密码不能为空");
        }

        // 2. 查询用户信息（同时验证用户ID和密码）
        UserInfo userInfo = userMapper.selectByUserIdAndPassword(userId.trim(), password.trim());

        // 3. 判断用户是否存在或密码不正确
        if (userInfo == null) {
            logger.warn("用户不存在或密码不正确，userId: {}", userId);
            throw new RuntimeException("账号不存在或密码不正确");
        }

        logger.info("登录成功，userId: {}, userName: {}", userInfo.getUserid(), userInfo.getUsername());
        
        // 4. 返回完整的用户信息（Controller层会保存到Session中）
        return userInfo;
    }
}
