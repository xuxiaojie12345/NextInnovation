package com.web.app.domain;

/**
 * 通用API响应包装类
 * 统一返回格式：{ code: 200, message: "success", data: T }
 */
 /**

  * ApiResponse

  */

public class ApiResponse<T> {
    
/** code */

    private Integer code;
    /** message */

    private String message;
    /** data */

    private T data;

    public ApiResponse() {
    }

    public ApiResponse(Integer code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    /**
     * 成功响应
     */
     /**

      * success

      */

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, "success", data);
    }

    /**
     * 失败响应
     */
     /**

      * error

      */

    public static <T> ApiResponse<T> error(Integer code, String message) {
        return new ApiResponse<>(code, message, null);
    }

    /**
     * 404 未找到
     */
     /**

      * notFound

      */

    public static <T> ApiResponse<T> notFound(String message) {
        return new ApiResponse<>(404, message, null);
    }

    /**
     * 500 服务器错误
     */
     /**

      * serverError

      */

    public static <T> ApiResponse<T> serverError() {
        return new ApiResponse<>(500, "Internal server error", null);
    }

    public Integer getCode() {
        return code;
    }

    public void setCode(Integer code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }
}
