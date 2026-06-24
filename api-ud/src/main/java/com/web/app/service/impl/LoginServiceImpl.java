package com.web.app.service.impl;

import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.entity.User;
import com.web.app.mapper.UserMapper;
import com.web.app.service.LoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * 登录服务实现类
 */
@Service
public class LoginServiceImpl implements LoginService {
    
    @Autowired
    private UserMapper userMapper;
    
    @Override
    public LoginResponse login(LoginRequest request) {
        LoginResponse response = new LoginResponse();

        // 参数校验 - userId必填
        if (request.getUserId() == null || request.getUserId().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("用户ID不能为空");
            return response;
        }

        // 使用动态条件查询：有密码时认证登录，无密码时仅查询用户信息
        User user = userMapper.selectByCondition(
                request.getUserId(),
                request.getPassword()
        );

        if (user == null) {
            // 区分登录认证和用户查询两种场景的错误消息
            if (request.getPassword() != null && !request.getPassword().isEmpty()) {
                // 登录认证场景
                User userExists = userMapper.selectByUserId(request.getUserId());
                if (userExists == null) {
                    response.setCode(404);
                    response.setMsg("账号不存在");
                } else {
                    response.setCode(401);
                    response.setMsg("密码不正确");
                }
            } else {
                // 用户查询场景（UD25用）
                response.setCode(404);
                response.setMsg("用户不存在");
            }
            return response;
        }

        // 成功
        response.setCode(200);
        response.setMsg("登录成功");
        response.setData(user);

        return response;
    }
}
