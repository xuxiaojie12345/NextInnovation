package com.web.app.dto;

import lombok.Data;

/**
 * 统一返回格式封装
 * 对应设计书 4.1 响应格式：{ "code": 200, "message": "success", "data": {...} }
 *
 * @param <T> data 数据类型
 */
@Data
public class ApiResponse<T> {

    /** 状态码：200 成功，500 服务器内部错误 */
    private int code;

    /** 结果消息 */
    private String message;

    /** 数据体 */
    private T data;

    /**
     * 成功响应
     */
    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> res = new ApiResponse<>();
        res.setCode(200);
        res.setMessage("success");
        res.setData(data);
        return res;
    }

    /**
     * 失败响应（设计书 Response Error：code=500）
     */
    public static <T> ApiResponse<T> error(int code, String message) {
        ApiResponse<T> res = new ApiResponse<>();
        res.setCode(code);
        res.setMessage(message);
        res.setData(null);
        return res;
    }
}
