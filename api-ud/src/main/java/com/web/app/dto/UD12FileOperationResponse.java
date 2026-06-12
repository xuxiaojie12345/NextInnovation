package com.web.app.dto;

import lombok.Data;

@Data
public class UD12FileOperationResponse {
    private int code;
    private String msg;
    private Object data;

    public static UD12FileOperationResponse success(String msg) {
        UD12FileOperationResponse res = new UD12FileOperationResponse();
        res.setCode(200);
        res.setMsg(msg);
        res.setData(null);
        return res;
    }

    public static UD12FileOperationResponse error(String msg) {
        UD12FileOperationResponse res = new UD12FileOperationResponse();
        res.setCode(400);
        res.setMsg(msg);
        return res;
    }
}
