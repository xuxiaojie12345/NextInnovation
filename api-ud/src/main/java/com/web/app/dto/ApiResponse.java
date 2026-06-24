package com.web.app.dto;

import lombok.Data;

/**
 * 统一响应对象
 * 
 * @description 所有API的统一响应格式
 */
@Data
public class ApiResponse<T> {
    /**
     * 响应码
     */
    private int code;
    
    /**
     * 响应消息
     */
    private String msg;
    
    /**
     * 响应数据
     */
    private T data;
    
    /**
     * 错误码（可选）
     */
    private String errorCode;
    
    /**
     * 成功响应构造器
     * 
     * @param code 响应码
     * @param msg 响应消息
     * @param data 响应数据
     */
    public ApiResponse(int code, String msg, T data) {
        this.code = code;
        this.msg = msg;
        this.data = data;
    }
    
    /**
     * 错误响应构造器
     * 
     * @param code 响应码
     * @param msg 响应消息
     * @param errorCode 错误码
     */
    public ApiResponse(int code, String msg, String errorCode) {
        this.code = code;
        this.msg = msg;
        this.errorCode = errorCode;
        this.data = null;
    }
    
    /**
     * 创建成功响应
     * 
     * @param data 响应数据
     * @return 成功响应对象
     */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, "操作成功", data);
    }
    
    /**
     * 创建成功响应（带自定义消息）
     * 
     * @param msg 响应消息
     * @param data 响应数据
     * @return 成功响应对象
     */
    public static <T> ApiResponse<T> success(String msg, T data) {
        return new ApiResponse<>(200, msg, data);
    }
    
    /**
     * 创建失败响应
     * 
     * @param code 错误码
     * @param msg 错误消息
     * @param errorCode 错误代码
     * @return 失败响应对象
     */
    public static <T> ApiResponse<T> error(int code, String msg, String errorCode) {
        return new ApiResponse<>(code, msg, errorCode);
    }
}
