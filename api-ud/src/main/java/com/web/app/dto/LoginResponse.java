package com.web.app.dto;

/**
 * 登录统一响应 DTO
 * 返回标准格式：
 * {
 *     "code": 200,
 *     "message": "success",
 *     "data": {
 *         "token": "xxxx",
 *         "userId": "取得的userID",
 *         "username": "xxx"
 *     }
 * }
 */
public class LoginResponse {

    /** 状态码（200=成功, 401=认证失败） */
    private int code;

    /** 消息内容 */
    private String message;

    /** 响应数据 */
    private Object data;

    public LoginResponse() {}

    public LoginResponse(int code, String message, Object data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    /**
     * 构建成功响应
     * @param token 生成的Token
     * @param userId 用户ID
     * @param username 用户名
     * @return 响应对象
     */
    public static LoginResponse success(String token, String userId, String username) {
        LoginData data = new LoginData(token, userId, username);
        return new LoginResponse(200, "success", data);
    }

    /**
     * 构建失败响应
     * @param message 错误消息
     * @return 响应对象
     */
    public static LoginResponse fail(String message) {
        return new LoginResponse(401, message, null);
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

    /**
     * 登录成功返回的数据体
     */
    static class LoginData {
        private String token;
        private String userId;
        private String username;

        public LoginData(String token, String userId, String username) {
            this.token = token;
            this.userId = userId;
            this.username = username;
        }

        public String getToken() {
            return token;
        }

        public String getUserId() {
            return userId;
        }

        public String getUsername() {
            return username;
        }
    }
}
