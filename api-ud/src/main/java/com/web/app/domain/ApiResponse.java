package com.web.app.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 通用API响应对象
 * @param <T> 响应数据类型
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    
    /**
     * 响应码 (200: 成功, 其他: 失败)
     */
    private Integer code;
    
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
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .code(200)
                .msg("查询成功")
                .data(data)
                .build();
    }
    
    /**
     * 成功响应(自定义消息)
     */
    public static <T> ApiResponse<T> success(String msg, T data) {
        return ApiResponse.<T>builder()
                .code(200)
                .msg(msg)
                .data(data)
                .build();
    }
    
    /**
     * 失败响应
     */
    public static <T> ApiResponse<T> error(Integer code, String msg) {
        return ApiResponse.<T>builder()
                .code(code)
                .msg(msg)
                .data(null)
                .build();
    }
}
