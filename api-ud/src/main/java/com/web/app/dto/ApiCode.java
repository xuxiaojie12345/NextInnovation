package com.web.app.dto;

import java.io.Serializable;

/**
 * 业务状态码常量定义
 * 严格对应详细设计 5.1.7 状态码一览
 *
 * @author GitHub Copilot
 */
public final class ApiCode implements Serializable {

  /** 序列化版本号 */
  private static final long serialVersionUID = 1L;

  /** 认证成功 */
  public static final int SUCCESS = 200;

  /** 用户名或密码错误 */
  public static final int INVALID_CREDENTIALS = 401;

  /** 账户已锁定 */
  public static final int ACCOUNT_LOCKED = 403;

  /** 服务器内部错误 */
  public static final int SYSTEM_ERROR = 500;

  /** 网络断开 / 请求超时（前端使用） */
  public static final int NETWORK_ERROR = 0;

  /** 私有构造方法，禁止实例化常量类 */
  private ApiCode() {
  }
}
