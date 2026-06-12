package com.web.app.dto;

import lombok.Data;

@Data
public class LoginResponse {
    private int code;
    private String msg;
    private DataInfo data;

    @Data
    public static class DataInfo {
        private String token;
        private String userId;
        private String username;
    }

    public static LoginResponse success(String token, String userId, String username) {
        LoginResponse res = new LoginResponse();
        res.setCode(200);
        res.setMsg("登录成功");
        DataInfo d = new DataInfo();
        d.setToken(token);
        d.setUserId(userId);
        d.setUsername(username);
        res.setData(d);
        return res;
    }

    public static LoginResponse error(String msg) {
        LoginResponse res = new LoginResponse();
        res.setCode(400);
        res.setMsg(msg);
        return res;
    }
}
