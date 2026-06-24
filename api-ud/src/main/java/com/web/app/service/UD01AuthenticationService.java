package com.web.app.service;

import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;

/**
 * UD01认证服务接口
 * 对应API：UD01Authentication - /api/UD01/login
 * 
 * 说明：此API为共通API，除Login画面外其他画面也会调用。
 */
public interface UD01AuthenticationService {
    
    /**
     * 用户登录认证
     * 
     * 处理流程（对应txt文件4.1节）：
     * 4.4 对请求参数进行非空、长度、格式等合法性校验
     * 4.5 通过HdocUserInfoMapper查询数据库中的用户信息
     * 4.6 登录核心验证：判断用户是否存在、密码是否正确
     * 4.7 验证通过后构建登录成功响应
     * 
     * @param loginRequest 登录请求参数（userId必填、password必填、username可选）
     * @return 登录成功时返回LoginResponse（包含用户信息）
     * @throws RuntimeException 认证失败时抛出（包含错误信息）
     */
    LoginResponse login(LoginRequest loginRequest);
}
