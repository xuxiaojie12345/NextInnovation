package com.web.app.dto;

import lombok.Data;

@Data
public class UD09DeleteResponse {
    private int code;
    private String msg;
    private Object data;

    public static UD09DeleteResponse success() {
        UD09DeleteResponse res = new UD09DeleteResponse();
        res.setCode(200);
        res.setMsg("记录删除成功");
        res.setData(new Object());
        return res;
    }

    public static UD09DeleteResponse error(String msg) {
        UD09DeleteResponse res = new UD09DeleteResponse();
        res.setCode(400);
        res.setMsg(msg);
        return res;
    }
}
