package com.web.app.controller;

import com.web.app.dto.ApiResult;
import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.service.AuthenticationService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

/**
 * 认证控制器
 * 对应详细设计 5.1 AuthenticationApi：POST /api/auth/login
 * 返回体格式严格遵循 { "code": 200, "data": {...}, "message": "success" }
 *
 * @author GitHub Copilot
 */
@Api(tags = "认证管理")
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthenticationController {

  /** 认证服务 */
  @Resource
  private AuthenticationService authenticationService;

  /**
   * 用户登录认证
   * 前端 Login.tsx 通过 axios 以 POST + JSON 方式调用本接口。
   *
   * @param request 登录请求体 { "userid": "string", "password": "string" }
   * @return HTTP 状态码与业务状态码一致的响应体（200 / 401 / 403 / 500）
   */
  @ApiOperation("用户登录认证")
  @PostMapping("/login")
  public ResponseEntity<ApiResult<LoginResponse>> login(
      @RequestBody(required = false) LoginRequest request) {
    ApiResult<LoginResponse> result = authenticationService.login(request);
    // 业务状态码与 HTTP 状态码保持一致，便于前端 axios 统一捕获 401 / 403 / 500
    return ResponseEntity.status(result.getCode()).body(result);
  }
}
