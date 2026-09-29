package com.web.app.service;

import com.web.app.dto.ApiResult;
import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;

/**
 * 认证服务接口
 * 对应详细设计 5.1 AuthenticationApi 的业务逻辑层定义。
 *
 * @author GitHub Copilot
 */
public interface AuthenticationService {

  /**
   * 用户登录认证
   * 详细设计 4.1 处理流程：参数校验 → 查询用户 → 密码比对 → 账号锁定判定 → 生成 Token → 构建响应
   *
   * @param request 登录请求对象（userid + password）
   * @return 统一格式的认证结果
   */
  ApiResult<LoginResponse> login(LoginRequest request);
}
