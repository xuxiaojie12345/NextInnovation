package com.web.app.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * 统一API响应包装类
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
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
     * 成功响应
     */
    public static <T> ApiResponse<T> success(String msg, T data) {
        return new ApiResponse<>(200, msg, data);
    }
    
    /**
     * 失败响应
     */
    public static <T> ApiResponse<T> error(int code, String msg) {
        return new ApiResponse<>(code, msg, null);
    }
}
