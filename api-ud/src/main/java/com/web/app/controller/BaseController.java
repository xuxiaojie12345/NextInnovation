package com.web.app.controller;

import com.web.app.constant.MessageConstants;
import com.web.app.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * Controller 基类 — 抽取公共的错误处理与响应构建逻辑
 */
public class BaseController {

  protected BaseController() {
    // 防止直接实例化
  }

  /**
   * 返回 500 系统错误响应
   */
  protected static <T> ResponseEntity<ApiResponse<T>> systemError() {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiResponse.error(500, MessageConstants.SYSTEM_ERROR));
  }

  /**
   * 返回 500 系统错误响应（带自定义消息）
   */
  protected static <T> ResponseEntity<ApiResponse<T>> systemError(String message) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiResponse.error(500, message));
  }

  /**
   * 返回 400 参数错误响应
   */
  protected static <T> ResponseEntity<ApiResponse<T>> badRequest(String message) {
    return ResponseEntity.badRequest()
        .body(ApiResponse.error(400, message));
  }

  /**
   * 返回 401 未授权响应
   */
  protected static <T> ResponseEntity<ApiResponse<T>> unauthorized(String message) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(ApiResponse.error(401, message));
  }

  /**
   * 返回 404 未找到响应
   */
  protected static <T> ResponseEntity<ApiResponse<T>> notFound(String message) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(ApiResponse.error(404, message));
  }

  /**
   * 返回成功响应
   */
  protected static <T> ResponseEntity<ApiResponse<T>> ok(T data) {
    return ResponseEntity.ok(ApiResponse.success(data));
  }

  /**
   * 返回成功响应（带自定义消息）
   */
  protected static <T> ResponseEntity<ApiResponse<T>> ok(T data, String message) {
    ApiResponse<T> response = ApiResponse.success(data);
    response.setMessage(message);
    return ResponseEntity.ok(response);
  }

  /**
   * 返回 403 禁止访问响应
   */
  protected static <T> ResponseEntity<ApiResponse<T>> forbidden(String message) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(ApiResponse.error(403, message));
  }

  /**
   * 返回 409 冲突响应
   */
  protected static <T> ResponseEntity<ApiResponse<T>> conflict(String message) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(ApiResponse.error(409, message));
  }

  /**
   * 返回 422 不可处理实体响应
   */
  protected static <T> ResponseEntity<ApiResponse<T>> unprocessableEntity(String message) {
    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
        .body(ApiResponse.error(422, message));
  }

  /**
   * 返回成功响应（无数据体，仅消息）
   */
  protected static <T> ResponseEntity<ApiResponse<T>> okWithMessage(String message) {
    ApiResponse<T> response = ApiResponse.success(null);
    response.setMessage(message);
    return ResponseEntity.ok(response);
  }

  /**
   * 判断字符串参数是否为空
   */
  protected static boolean isParamMissing(String value) {
    return value == null || value.trim().isEmpty();
  }

  /**
   * 判断集合参数是否为空
   */
  protected static boolean isCollectionEmpty(java.util.Collection<?> collection) {
    return collection == null || collection.isEmpty();
  }

  /**
   * 判断 Map 参数是否为空
   */
  protected static boolean isMapEmpty(java.util.Map<?, ?> map) {
    return map == null || map.isEmpty();
  }

  /**
   * 安全地获取字符串参数，为空时返回默认值
   */
  protected static String paramOrDefault(String value, String defaultValue) {
    return isParamMissing(value) ? defaultValue : value.trim();
  }

  /**
   * 记录警告日志并返回系统错误响应
   */
  protected static <T> ResponseEntity<ApiResponse<T>> logAndSystemError(org.slf4j.Logger log, String message, Exception e) {
    log.warn(message, e);
    return systemError();
  }

  /**
   * 记录错误日志并返回系统错误响应
   */
  protected static <T> ResponseEntity<ApiResponse<T>> logAndSystemError(org.slf4j.Logger log, Exception e) {
    log.error("Unexpected error occurred", e);
    return systemError();
  }
}
