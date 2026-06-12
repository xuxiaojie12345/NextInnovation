package com.web.app.dto;

import lombok.Data;

@Data
public class UD15StatusUpdateResponse {
    private int code;
    private String msg;
    private Object data;

    public static UD15StatusUpdateResponse success() {
        UD15StatusUpdateResponse res = new UD15StatusUpdateResponse();
        res.setCode(200);
        res.setMsg("状态已更新为完成");
        res.setData(null);
        return res;
    }

    public static UD15StatusUpdateResponse error(String msg) {
        UD15StatusUpdateResponse res = new UD15StatusUpdateResponse();
        res.setCode(400);
        res.setMsg(msg);
        return res;
    }
}
