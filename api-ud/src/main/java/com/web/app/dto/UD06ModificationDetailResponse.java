package com.web.app.dto;

import lombok.Data;

@Data
public class UD06ModificationDetailResponse {
    private int code;
    private String msg;
    private DataInfo data;

    @Data
    public static class DataInfo {
        private String doctype;
        private String version;
        private String storingInfo;
        private String foundUnreleasedVersion;
    }

    public static UD06ModificationDetailResponse success(DataInfo data) {
        UD06ModificationDetailResponse res = new UD06ModificationDetailResponse();
        res.setCode(200);
        res.setMsg("Success");
        res.setData(data);
        return res;
    }

    public static UD06ModificationDetailResponse error(String msg) {
        UD06ModificationDetailResponse res = new UD06ModificationDetailResponse();
        res.setCode(400);
        res.setMsg(msg);
        return res;
    }
}
