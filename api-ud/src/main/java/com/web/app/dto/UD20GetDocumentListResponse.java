package com.web.app.dto;

import lombok.Data;
import java.util.List;

@Data
public class UD20GetDocumentListResponse {
    private int code;
    private String msg;
    private DataInfo data;

    @Data
    public static class DataInfo {
        private List<DocumentInfo> documents;
    }

    @Data
    public static class DocumentInfo {
        private String doctype;
        private String registerUser;
        private String registerDatetime;
    }

    public static UD20GetDocumentListResponse success(List<DocumentInfo> documents) {
        UD20GetDocumentListResponse res = new UD20GetDocumentListResponse();
        res.setCode(200);
        res.setMsg("查询成功");
        DataInfo d = new DataInfo();
        d.setDocuments(documents);
        res.setData(d);
        return res;
    }
}
