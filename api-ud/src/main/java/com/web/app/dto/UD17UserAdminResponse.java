package com.web.app.dto;

import lombok.Data;

@Data
public class UD17UserAdminResponse {
    private int code;
    private String msg;
    private Object data;

    public static UD17UserAdminResponse success(String msg) {
        UD17UserAdminResponse res = new UD17UserAdminResponse();
        res.setCode(200);
        res.setMsg(msg);
        res.setData(null);
        return res;
    }

    public static UD17UserAdminResponse error(String msg) {
        UD17UserAdminResponse res = new UD17UserAdminResponse();
        res.setCode(400);
        res.setMsg(msg);
        return res;
    }
}
