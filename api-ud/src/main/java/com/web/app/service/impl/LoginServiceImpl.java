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
        
        // 参数校验
        if (request.getUserId() == null || request.getUserId().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("用户ID不能为空");
            return response;
        }
        
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("密码不能为空");
            return response;
        }
        
        // 查询用户
        User user = userMapper.selectByUserId(request.getUserId());
        
        if (user == null) {
            response.setCode(404);
            response.setMsg("账号不存在");
            return response;
        }
        
        // 验证密码（实际项目中应该使用加密比对）
        if (!user.getPassword().equals(request.getPassword())) {
            response.setCode(401);
            response.setMsg("密码不正确");
            return response;
        }
        
        // 登录成功
        response.setCode(200);
        response.setMsg("登录成功");
        response.setData(user);
        
        return response;
    }
}
