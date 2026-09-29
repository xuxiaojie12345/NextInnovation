package com.web.app.exception;

import com.web.app.dto.ApiCode;
import com.web.app.dto.ApiResult;
import com.web.app.dto.MessageConstants;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理器
 * 对应详细设计第 6 章异常处理：数据库连接失败等未预期异常统一返回 500 与系统异常消息。
 *
 * @author GitHub Copilot
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

  /** 日志对象 */
  private static final Logger logger = LogManager.getLogger(GlobalExceptionHandler.class);

  /**
   * 处理业务异常
   * 业务异常携带明确的状态码（401 / 403 / 500），直接透传至前端。
   *
   * @param exception 业务异常
   * @return 对应状态码的 API 返回体
   */
  @ExceptionHandler(BusinessException.class)
  public ResponseEntity<ApiResult<Void>> handleBusinessException(BusinessException exception) {
    logger.warn("业务异常, code = {}, message = {}", exception.getCode(), exception.getMessage());
    HttpStatus status = HttpStatus.resolve(exception.getCode());
    // 状态码无法映射为标准 HTTP 状态时统一返回 500
    if (status == null) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }
    return ResponseEntity.status(status)
        .body(ApiResult.failure(exception.getCode(), exception.getMessage()));
  }

  /**
   * 处理未预期异常（兜底）
   * 详细设计第 6 章：数据库连接失败等场景返回 500，并提示联系管理员。
   * 注意：日志中不得输出明文密码等敏感信息。
   *
   * @param exception 未预期异常
   * @return 500 的 API 返回体
   */
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResult<Void>> handleException(Exception exception) {
    logger.error("系统异常: {}", exception.getMessage(), exception);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiResult.failure(ApiCode.SYSTEM_ERROR, MessageConstants.SYSTEM_ERROR));
  }
}
