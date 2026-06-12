package com.web.app.dto;

import lombok.Data;
import java.util.List;

@Data
public class UD18UserDocResponse {
    private int code;
    private String msg;
    private DataInfo data;

    @Data
    public static class DataInfo {
        private List<UD18DocumentListResponse.DocumentItem> documents;
    }

    public static UD18UserDocResponse success(List<UD18DocumentListResponse.DocumentItem> documents) {
        UD18UserDocResponse res = new UD18UserDocResponse();
        res.setCode(200);
        res.setMsg("获取成功");
        DataInfo d = new DataInfo();
        d.setDocuments(documents);
        res.setData(d);
        return res;
    }

    public static UD18UserDocResponse error(String msg) {
        UD18UserDocResponse res = new UD18UserDocResponse();
        res.setCode(400);
        res.setMsg(msg);
        return res;
    }
}
