package com.web.app.dto;

import lombok.Data;

@Data
public class UpdateModificationResponse {
    private int code;
    private String msg;
    private Object data;

    public static UpdateModificationResponse success() {
        UpdateModificationResponse res = new UpdateModificationResponse();
        res.setCode(200);
        res.setMsg("Success");
        res.setData(new Object());
        return res;
    }

    public static UpdateModificationResponse error(String msg) {
        UpdateModificationResponse res = new UpdateModificationResponse();
        res.setCode(400);
        res.setMsg(msg);
        return res;
    }
}
