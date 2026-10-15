package com.web.app.dto;

import java.io.Serializable;

/**
 * 后端提示消息常量定义
 * 消息文案与《Login_詳細設計.md》第 5 章、第 6 章严格一致（英文文案），
 * 便于前端直接使用后端返回的 message 显示。
 *
 * @author GitHub Copilot
 */
public final class MessageConstants implements Serializable {

  /** 序列化版本号 */
  private static final long serialVersionUID = 1L;

  /** 认证成功 */
  public static final String SUCCESS = "success";

  /** 用户名或密码错误（401） */
  public static final String INVALID_CREDENTIALS =
      "We didn't recognize the username or password you entered. Please try again.";

  /** 账户已锁定（403） */
  public static final String ACCOUNT_LOCKED =
      "Your account is locked. Please contact your system administrator.";

  /** 系统异常（500） */
  public static final String SYSTEM_ERROR = "System error. Please contact administrator.";

  /** 请求参数为空（UserID 或 Password 未输入） */
  public static final String REQUIRED = "Username and password are required.";

  /** UserID 格式错误（非半角英数字） */
  public static final String USERID_FORMAT =
      "UserID must contain only half-width alphanumeric characters.";

  /** Password 格式错误（含非法字符） */
  public static final String PASSWORD_FORMAT = "Password contains invalid characters.";

  /** UserID 超长 */
  public static final String USERID_LENGTH = "UserID must be 10 characters or less.";

  /** Password 超长 */
  public static final String PASSWORD_LENGTH = "Password must be 32 characters or less.";

  /** Chassis series 必填（UD03，详细设计 3.1.1 / 测试用例 13） */
  public static final String CHASSIS_SERIES_REQUIRED = "Chassis series is required.";

  /** Chassis series 格式非法（UD03，仅允许半角英字） */
  public static final String CHASSIS_SERIES_FORMAT =
      "Chassis series must contain only half-width letters.";

  /** Chassis no 必填（UD03，详细设计 3.1.1 / 测试用例 13） */
  public static final String CHASSIS_NO_REQUIRED = "Chassis no is required.";

  /** Chassis no 格式非法（UD03，仅允许半角数字） */
  public static final String CHASSIS_NO_FORMAT = "Chassis no must contain only half-width numbers.";

  /** Document type 必填（UD03，详细设计 2.1 控件 3） */
  public static final String DOCUMENT_TYPE_REQUIRED = "Document type is required.";

  /** 私有构造方法，禁止实例化常量类 */
  private MessageConstants() {
  }
}
