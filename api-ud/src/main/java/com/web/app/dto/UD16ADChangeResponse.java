package com.web.app.dto;

import lombok.Data;

@Data
public class UD16ADChangeResponse {
    private int code;
    private String msg;
    private Object data;

    public static UD16ADChangeResponse success(String msg) {
        UD16ADChangeResponse res = new UD16ADChangeResponse();
        res.setCode(200);
        res.setMsg(msg);
        res.setData(null);
        return res;
    }

    public static UD16ADChangeResponse error(String msg) {
        UD16ADChangeResponse res = new UD16ADChangeResponse();
        res.setCode(400);
        res.setMsg(msg);
        return res;
    }
}
