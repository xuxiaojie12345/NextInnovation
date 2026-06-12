package com.web.app.dto;

import lombok.Data;
import java.util.List;

@Data
public class UD18DocumentListResponse {
    private int code;
    private String msg;
    private DataInfo data;

    @Data
    public static class DataInfo {
        private List<DocumentItem> documents;
    }

    @Data
    public static class DocumentItem {
        private String doctype;
        private String description;
    }

    public static UD18DocumentListResponse success(List<DocumentItem> documents) {
        UD18DocumentListResponse res = new UD18DocumentListResponse();
        res.setCode(200);
        res.setMsg("获取成功");
        DataInfo d = new DataInfo();
        d.setDocuments(documents);
        res.setData(d);
        return res;
    }

    public static UD18DocumentListResponse error(String msg) {
        UD18DocumentListResponse res = new UD18DocumentListResponse();
        res.setCode(400);
        res.setMsg(msg);
        return res;
    }
}
