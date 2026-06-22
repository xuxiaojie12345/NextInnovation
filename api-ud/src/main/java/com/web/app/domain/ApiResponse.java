package com.web.app.domain;

import lombok.Data;
import java.io.Serializable;

/**
 * 统一API响应对象
 * 
 * @param <T> 响应数据类型
 */
@Data
public class ApiResponse<T> implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer code;     // 响应码
    private String msg;       // 响应消息
    private T data;           // 响应数据

    /**
     * 成功响应
     * 
     * @param msg 响应消息
     * @param data 响应数据
     * @return 统一响应对象
     */
    public static <T> ApiResponse<T> success(String msg, T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(200);
        response.setMsg(msg);
        response.setData(data);
        return response;
    }

    /**
     * 成功响应（无数据）
     * 
     * @param msg 响应消息
     * @return 统一响应对象
     */
    public static <T> ApiResponse<T> success(String msg) {
        return success(msg, null);
    }

    /**
     * 失败响应
     * 
     * @param code 错误码
     * @param msg 错误消息
     * @return 统一响应对象
     */
    public static <T> ApiResponse<T> error(Integer code, String msg) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(code);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }

    /**
     * 失败响应（默认500错误码）
     * 
     * @param msg 错误消息
     * @return 统一响应对象
     */
    public static <T> ApiResponse<T> error(String msg) {
        return error(500, msg);
    }
}
