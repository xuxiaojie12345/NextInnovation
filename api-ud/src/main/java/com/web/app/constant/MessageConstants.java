package com.web.app.constant;

/**
 * 消息常量类 — 统一管理所有 Controller 中的错误/成功提示信息
 */
public final class MessageConstants {

  private MessageConstants() {
    throw new UnsupportedOperationException("Constants class cannot be instantiated");
  }

  // ═══════════════════════════════════════════
  //  通用系统消息
  // ═══════════════════════════════════════════
  public static final String SYSTEM_ERROR = "System error. Please contact administrator.";
  public static final String BAD_REQUEST = "Invalid request parameters.";
  public static final String FILE_NOT_FOUND = "File not found.";

  // ═══════════════════════════════════════════
  //  登录模块
  // ═══════════════════════════════════════════
  public static final String LOGIN_CREDENTIALS_REQUIRED = "Username and password are required.";
  public static final String LOGIN_INVALID_CREDENTIALS =
      "We didn't recognize the username or password you entered. Please try again.";
  public static final String LOGIN_SUCCESS = "登录成功";

  // ═══════════════════════════════════════════
  //  参数校验
  // ═══════════════════════════════════════════
  public static final String USER_ID_REQUIRED = "User ID is required.";
  public static final String AUTH_LIST_REQUIRED = "Auth list is required.";
  public static final String VARIABLE_NAME_REQUIRED = "Variable name is required.";
  public static final String VARIABLE_REQUIRED = "Variable is required.";
  public static final String FILE_NAME_REQUIRED = "File name is required.";
  public static final String MARKET_REQUIRED = "Market is required.";
  public static final String FILE_IS_EMPTY = "File is empty.";
  public static final String MARKET_FOLDER_NOT_FOUND = "Market folder not found.";
  public static final String PATH_TRAVERSAL_DETECTED =
      "Invalid file name: path traversal characters are not allowed.";
  public static final String PC_NUM_MARKET_REQUIRED = "pc, num and market are required.";

  // ═══════════════════════════════════════════
  //  底盘/车辆信息
  // ═══════════════════════════════════════════
  public static final String INVALID_CHASSIS_INFO = "Invalid chassis information.";
  public static final String CHASSIS_NOT_FOUND = "Chassis no is not exists";
  public static final String VEHICLE_DATA_NOT_FOUND = "No vehicle data found for the given chassis number.";
  public static final String SERIE_CHNR_REQUIRED = "Serie and CHNR are required.";
  public static final String SERIE_CHNR_ACT_REQUIRED = "Serie, CHNR and ACT are required.";
  public static final String INVALID_REQUEST_PARAMS = "Invalid request parameters.";

  // ═══════════════════════════════════════════
  //  数据操作
  // ═══════════════════════════════════════════
  public static final String VARIABLE_NOT_FOUND = "Variable not found.";
  public static final String DATA_NOT_EXISTS = "Data does not exist, Please enter the correct content.";
  public static final String FAILED_TO_ADD_VARIABLE = "Failed to add variable.";
  public static final String FAILED_TO_ADD_RULE = "Failed to add rule.";
  public static final String FAILED_TO_INSERT_ADCA = "Failed to insert ADCA change record.";
  public static final String FAILED_TO_UPDATE_ADCA = "更新失败";
  public static final String VARIABLES_UPDATED_SUCCESS = "Variables updated successfully.";

  // ═══════════════════════════════════════════
  //  状态更新消息
  // ═══════════════════════════════════════════
  public static final String ACT_STATUS_UPDATED = "ACT status has been set to N for all records.";
  public static final String STATUS_REGENERATE = "Status updated to regenerate.";
  public static final String STATUS_OK = "Status updated to OK.";
  public static final String TYPE_CHANGED_TO_BASIC = "Type changed to Basic Info.";
  public static final String TYPE_CHANGED_TO_ADVANCED = "Type changed to Advanced Info.";
}
