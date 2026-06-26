package com.web.app.service.impl;

import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.entity.HdocUserInfo;
import com.web.app.mapper.HdocUserInfoMapper;
import com.web.app.service.UD01AuthenticationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * UD01认证服务实现类
 * 对应API：UD01Authentication - /api/UD01/login
 */
@Service
public class UD01AuthenticationServiceImpl implements UD01AuthenticationService {
    
    @Autowired
    private HdocUserInfoMapper hdocUserInfoMapper;
    
    /**
     * 用户登录认证
     * 
     * 处理流程（严格按照txt文件4.1节）：
     * 4.4 对请求参数进行非空、长度、格式等合法性校验
     * 4.5 通过HdocUserInfoMapper查询数据库中的用户信息
     * 4.6 登录核心验证逻辑：
     *     - 判断用户是否存在，不存在则返回"账号不存在"
     *     - 比对前端传递密码与数据库密码是否一致
     *     - 密码错误则返回"密码不正确"
     * 4.7 验证全部通过后，构建登录成功响应体，包含用户基础信息
     * 
     * @param loginRequest 登录请求参数
     * @return 登录成功响应（包含用户信息）
     */
    @Override
    public LoginResponse login(LoginRequest loginRequest) {
        
        // ===== 4.4 参数校验 =====
        // 请求对象非空校验
        if (loginRequest == null) {
            throw new IllegalArgumentException("登录请求不能为空");
        }
        
        // userId非空校验
        if (loginRequest.getUserId() == null || loginRequest.getUserId().trim().isEmpty()) {
            throw new IllegalArgumentException("用户ID不能为空");
        }
        
        // ===== 4.5 查询用户信息 =====
        // 通过HdocUserInfoMapper数据访问层，根据请求参数查询数据库中的用户信息
        HdocUserInfo userInfo = hdocUserInfoMapper.selectUserByLoginParam(
            loginRequest.getUserId(),
            loginRequest.getUsername(),
            loginRequest.getPassword()
        );
        
        // 判断用户是否存在
        if (userInfo == null) {
            throw new RuntimeException("用户信息不存在");
        }
        
        // ===== 4.6 密码验证（仅Login画面传入密码时执行）=====
        if (loginRequest.getPassword() != null && !loginRequest.getPassword().trim().isEmpty()) {
            // 比对前端传递密码与数据库密码是否一致
            if (!loginRequest.getPassword().equals(userInfo.getPassword())) {
                throw new RuntimeException("We didn't recognize the username or password you entered. Please try again.");
            }
        }
        
        // ===== 4.7 构建登录成功响应 =====
        LoginResponse response = new LoginResponse();
        response.setUserId(userInfo.getUserId());
        response.setUsername(userInfo.getUsername());
        response.setPassword(userInfo.getPassword());
        response.setResponsible(userInfo.getResponsible());
        response.setUserPosition(userInfo.getUserPosition());
        response.setEmail(userInfo.getEmail());
        
        return response;
    }
}
