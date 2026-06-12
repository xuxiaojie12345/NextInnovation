package com.web.app.dto;

import lombok.Data;

@Data
public class UD15ViewInfoResponse {
    private int code;
    private String msg;
    private DataInfo data;

    @Data
    public static class DataInfo {
        private String chassisNumber;
        private String type;
        private String status;
        private String message;
        private String registerDatetime;
        private String docReady;
        private String docSent;
        private XmlDocInfo xmlDoc;
    }

    @Data
    public static class XmlDocInfo {
        private Object printItemName;
        private Object variants;
    }

    public static UD15ViewInfoResponse success(DataInfo data) {
        UD15ViewInfoResponse res = new UD15ViewInfoResponse();
        res.setCode(200);
        res.setMsg("查询成功");
        res.setData(data);
        return res;
    }

    public static UD15ViewInfoResponse error(String msg) {
        UD15ViewInfoResponse res = new UD15ViewInfoResponse();
        res.setCode(400);
        res.setMsg(msg);
        return res;
    }
}
