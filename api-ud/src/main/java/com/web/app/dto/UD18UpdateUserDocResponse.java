package com.web.app.dto;

import lombok.Data;

@Data
public class UD18UpdateUserDocResponse {
    private int code;
    private String msg;
    private Object data;

    public static UD18UpdateUserDocResponse success() {
        UD18UpdateUserDocResponse res = new UD18UpdateUserDocResponse();
        res.setCode(200);
        res.setMsg("更新成功");
        res.setData(null);
        return res;
    }

    public static UD18UpdateUserDocResponse error(String msg) {
        UD18UpdateUserDocResponse res = new UD18UpdateUserDocResponse();
        res.setCode(400);
        res.setMsg(msg);
        return res;
    }
}
