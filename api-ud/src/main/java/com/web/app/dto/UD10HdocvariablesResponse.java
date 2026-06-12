package com.web.app.dto;

import lombok.Data;

@Data
public class UD10HdocvariablesResponse {
    private int code;
    private String msg;
    private Object data;

    public static UD10HdocvariablesResponse success() {
        UD10HdocvariablesResponse res = new UD10HdocvariablesResponse();
        res.setCode(200);
        res.setMsg("Success");
        res.setData(null);
        return res;
    }

    public static UD10HdocvariablesResponse error(String msg) {
        UD10HdocvariablesResponse res = new UD10HdocvariablesResponse();
        res.setCode(400);
        res.setMsg(msg);
        return res;
    }
}
