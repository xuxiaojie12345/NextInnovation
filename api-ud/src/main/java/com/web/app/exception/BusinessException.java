package com.web.app.exception;

/**
 * 业务异常类
 * 用于业务校验不通过时抛出，由全局异常处理器统一转换为 API 返回体。
 *
 * @author GitHub Copilot
 */
public class BusinessException extends RuntimeException {

  /** 序列化版本号 */
  private static final long serialVersionUID = 1L;

  /** 业务状态码 */
  private final int code;

  /**
   * 构造业务异常
   *
   * @param code    业务状态码
   * @param message 提示消息
   */
  public BusinessException(int code, String message) {
    super(message);
    this.code = code;
  }

  /**
   * 获取业务状态码
   *
   * @return 业务状态码
   */
  public int getCode() {
    return code;
  }
}
