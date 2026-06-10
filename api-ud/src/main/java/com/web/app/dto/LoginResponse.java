package com.web.app.dto;

/**
 * 登录响应DTO
 */
public class LoginResponse {

    private int code;
    private String msg;
    private Data data;

    public LoginResponse() {
    }

    public LoginResponse(int code, String msg, Data data) {
        this.code = code;
        this.msg = msg;
        this.data = data;
    }

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMsg() {
        return msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    public Data getData() {
        return data;
    }

    public void setData(Data data) {
        this.data = data;
    }

    /**
     * 登录成功
     */
    public static LoginResponse success(String token, String userId, String username) {
        LoginResponse response = new LoginResponse();
        response.setCode(200);
        response.setMsg("登录成功");
        Data data = new Data();
        data.setToken(token);
        data.setUserId(userId);
        data.setUsername(username);
        response.setData(data);
        return response;
    }

    /**
     * 登录失败
     */
    public static LoginResponse fail(String msg) {
        LoginResponse response = new LoginResponse();
        response.setCode(401);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }

    public static class Data {
        private String token;
        private String userId;
        private String username;

        public String getToken() {
            return token;
        }

        public void setToken(String token) {
            this.token = token;
        }

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }
    }
}
