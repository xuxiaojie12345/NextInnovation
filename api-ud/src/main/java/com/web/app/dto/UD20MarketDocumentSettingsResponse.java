package com.web.app.dto;

import lombok.Data;

@Data
public class UD20MarketDocumentSettingsResponse {
    private int code;
    private String msg;
    private DataInfo data;

    @Data
    public static class DataInfo {
        private String documentType;
        private String businessUnit;
        private String user;
        private String date;
    }

    public static UD20MarketDocumentSettingsResponse success(DataInfo data) {
        UD20MarketDocumentSettingsResponse res = new UD20MarketDocumentSettingsResponse();
        res.setCode(200);
        res.setMsg("更新成功");
        res.setData(data);
        return res;
    }

    public static UD20MarketDocumentSettingsResponse error(String msg) {
        UD20MarketDocumentSettingsResponse res = new UD20MarketDocumentSettingsResponse();
        res.setCode(400);
        res.setMsg(msg);
        return res;
    }
}
