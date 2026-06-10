package com.web.app.service.impl;

import com.web.app.domain.entity.HdocUserInfor;
import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.mapper.UserMapper;
import com.web.app.service.AuthService;
import com.web.app.tool.JwtUtil;
import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * 认证服务实现
 */
@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthServiceImpl.class);

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public LoginResponse login(LoginRequest request) {
        // 1. 参数校验
        if (request == null) {
            return LoginResponse.fail("请求参数不能为空");
        }
        if (StringUtils.isBlank(request.getUserId())) {
            return LoginResponse.fail("用户ID不能为空");
        }
        if (StringUtils.isBlank(request.getPassword())) {
            return LoginResponse.fail("密码不能为空");
        }

        // 2. 根据用户ID查询用户信息
        HdocUserInfor user = userMapper.findByUserId(request.getUserId());
        if (user == null) {
            return LoginResponse.fail("账号不存在");
        }

        // 3. 密码校验
        if (!request.getPassword().equals(user.getPassword())) {
            return LoginResponse.fail("密码不正确");
        }

        // 4. 生成Token
        String token = jwtUtil.generateToken(user.getUserid(), user.getUsername());

        logger.info("用户登录成功: userId={}", user.getUserid());

        // 5. 返回登录成功响应
        return LoginResponse.success(token, user.getUserid(), user.getUsername());
    }
}
