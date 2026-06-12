package com.web.app.dto;

import lombok.Data;

@Data
public class UD08SelectRulesResponse {
    private int code;
    private String msg;
    private DataInfo data;

    @Data
    public static class DataInfo {
        private boolean exists;
        private long count;
    }

    public static UD08SelectRulesResponse success(boolean exists, long count) {
        UD08SelectRulesResponse res = new UD08SelectRulesResponse();
        res.setCode(200);
        res.setMsg("Success");
        DataInfo d = new DataInfo();
        d.setExists(exists);
        d.setCount(count);
        res.setData(d);
        return res;
    }
}
