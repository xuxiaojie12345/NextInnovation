package com.web.app.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;

/**
 * 登录认证请求对象
 * 对应接口规格：POST /api/auth/login
 * Request Body 结构：{ "userid": "string", "password": "string" }
 *
 * @author GitHub Copilot
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest implements Serializable {

  /** 序列化版本号 */
  private static final long serialVersionUID = 1L;

  /** 用户ID（必填，最大 10 位半角英数字） */
  private String userid;

  /** 密码（必填，最大 32 位半角英数字 + 符号） */
  private String password;
}
