package com.web.app.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;

/**
 * 统一 API 返回体
 * 字段顺序严格遵循详细设计 5.1：code -> data -> message
 *
 * @param <T> 业务数据类型
 * @author GitHub Copilot
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResult<T> implements Serializable {

  /** 序列化版本号 */
  private static final long serialVersionUID = 1L;

  /** 业务状态码（200 / 401 / 403 / 500 / 0） */
  private Integer code;

  /** 业务数据（失败时为 null） */
  private T data;

  /** 提示消息 */
  private String message;

  /**
   * 构造成功响应
   *
   * @param data 业务数据
   * @param <T>  业务数据类型
   * @return 成功响应体
   */
  public static <T> ApiResult<T> success(T data) {
    return new ApiResult<>(ApiCode.SUCCESS, data, "success");
  }

  /**
   * 构造失败响应
   *
   * @param code    业务状态码
   * @param message 提示消息
   * @param <T>     业务数据类型
   * @return 失败响应体
   */
  public static <T> ApiResult<T> failure(Integer code, String message) {
    return new ApiResult<>(code, null, message);
  }
}
