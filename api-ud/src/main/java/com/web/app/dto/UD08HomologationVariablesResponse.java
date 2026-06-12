package com.web.app.dto;

import lombok.Data;

@Data
public class UD08HomologationVariablesResponse {
    private int code;
    private String msg;

    public static UD08HomologationVariablesResponse success(String msg) {
        UD08HomologationVariablesResponse res = new UD08HomologationVariablesResponse();
        res.setCode(200);
        res.setMsg(msg);
        return res;
    }

    public static UD08HomologationVariablesResponse error(String msg) {
        UD08HomologationVariablesResponse res = new UD08HomologationVariablesResponse();
        res.setCode(400);
        res.setMsg(msg);
        return res;
    }
}
