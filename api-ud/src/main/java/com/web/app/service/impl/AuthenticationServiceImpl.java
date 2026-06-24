package com.web.app.service.impl;

import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.entity.User;
import com.web.app.exception.BusinessException;
import com.web.app.mapper.UserMapper;
import com.web.app.service.AuthenticationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.UUID;

/**
 * 认证服务实现类
 * 
 * @description 实现用户登录认证的业务逻辑
 */
@Service
public class AuthenticationServiceImpl implements AuthenticationService {
    
    @Autowired
    private UserMapper userMapper;
    
    /**
     * 用户登录
     * 
     * @param loginRequest 登录请求对象
     * @return 登录响应对象
     */
    @Override
    public LoginResponse login(LoginRequest loginRequest) {
        // 对请求参数进行非空、长度、格式等合法性校验
        if (loginRequest.getUserid() == null || loginRequest.getUserid().trim().isEmpty()) {
            throw new BusinessException("用户ID不能为空");
        }
        
        if (loginRequest.getPassword() == null || loginRequest.getPassword().trim().isEmpty()) {
            throw new BusinessException("密码不能为空");
        }
        
        // 根据用户ID查询数据库中的用户信息
        User user = userMapper.selectByUserId(loginRequest.getUserid());
        
        // 判断用户或者密码是否存在
        if (user == null) {
            throw new BusinessException("We didn't recognize the username or password you entered. Please try again.");
        }
        
        // 验证密码（实际项目中应该使用加密后的密码进行比较）
        if (!user.getPassword().equals(loginRequest.getPassword())) {
            throw new BusinessException("We didn't recognize the username or password you entered. Please try again.");
        }
        
        // 检查用户状态
        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new BusinessException("用户已被禁用，请联系管理员");
        }
        
        // 生成Token（包含用户ID、用户名等）
        String token = generateToken(user.getUserId(), user.getUsername());
        
        // 记录登录时间
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        String loginTime = sdf.format(new Date());
        
        // 构建登录成功响应体
        return new LoginResponse(
            token,
            user.getUserId(),
            user.getUsername(),
            "USER", // 默认角色，实际应从数据库获取
            loginTime
        );
    }
    
    /**
     * 生成Token
     * 
     * @param userId 用户ID
     * @param username 用户名
     * @return Token字符串
     */
    private String generateToken(String userId, String username) {
        // 简单的Token生成逻辑，实际项目应使用JWT或其他安全的Token机制
        return UUID.randomUUID().toString().replace("-", "") + "_" + userId + "_" + username;
    }
}
