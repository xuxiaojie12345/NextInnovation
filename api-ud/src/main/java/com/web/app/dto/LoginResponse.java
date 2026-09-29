package com.web.app.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * 登录认证响应数据对象
 * 对应接口规格 5.1.2 Response Success (200) 的 data 部分：
 * { "userid": "string", "username": "string", "token": "string" }
 *
 * @author GitHub Copilot
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse implements Serializable {

  /** 序列化版本号 */
  private static final long serialVersionUID = 1L;

  /** 用户ID */
  private String userid;

  /** 用户名 */
  private String username;

  /** 认证令牌 */
  private String token;

  /** 用户功能权限列表（用于前端菜单控制） */
  private List<String> functions;

  /** 用户市场权限列表（用于前端数据范围控制） */
  private List<String> markets;
}
