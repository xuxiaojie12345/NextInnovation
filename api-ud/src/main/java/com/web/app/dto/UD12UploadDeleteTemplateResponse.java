package com.web.app.dto;

/**
 * UD12 Upload&Delete Template API 统一响应对象
 * 所有接口返回标准格式：
 * {
 *   "code": 200,
 *   "message": "success",
 *   "data": { ... }
 * }
 */
public class UD12UploadDeleteTemplateResponse {

    /** 状态码（200=成功, 401=失败/未授权） */
    private int code;

    /** 消息内容 */
    private String message;

    /** 响应数据 */
    private Object data;

    public UD12UploadDeleteTemplateResponse() {}

    public UD12UploadDeleteTemplateResponse(int code, String message, Object data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    /**
     * 构建成功响应
     * @param data 响应数据
     * @return 响应对象
     */
    public static UD12UploadDeleteTemplateResponse success(Object data) {
        return new UD12UploadDeleteTemplateResponse(200, "success", data);
    }

    /**
     * 构建成功响应（含自定义消息）
     * @param message 消息
     * @param data 响应数据
     * @return 响应对象
     */
    public static UD12UploadDeleteTemplateResponse success(String message, Object data) {
        return new UD12UploadDeleteTemplateResponse(200, message, data);
    }

    /**
     * 构建失败响应
     * @param message 错误消息
     * @return 响应对象
     */
    public static UD12UploadDeleteTemplateResponse fail(String message) {
        return new UD12UploadDeleteTemplateResponse(401, message, null);
    }

    /**
     * 构建失败响应（自定义状态码）
     * @param code 状态码
     * @param message 错误消息
     * @return 响应对象
     */
    public static UD12UploadDeleteTemplateResponse fail(int code, String message) {
        return new UD12UploadDeleteTemplateResponse(code, message, null);
    }

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }
}
