package com.web.app.dto;

import lombok.Data;
import java.util.List;

@Data
public class UD04GenerateDocumentResponse {
    private int code;
    private String msg;
    private DataInfo data;

    @Data
    public static class DataInfo {
        private String orderNumber;
        private String buildWeek;
        private String specWeek;
        private String market;
        private String sNoteNo;
        private String loadIndex;
        private boolean adChangeActive;
        private String usingTemplate;
        private List<ReplacementParam> replacementParams;
        private String date;
        private String version;
    }

    @Data
    public static class ReplacementParam {
        private String variable;
        private String newVal;
    }

    public static UD04GenerateDocumentResponse success(DataInfo data) {
        UD04GenerateDocumentResponse res = new UD04GenerateDocumentResponse();
        res.setCode(200);
        res.setMsg("Success");
        res.setData(data);
        return res;
    }

    public static UD04GenerateDocumentResponse error(String msg) {
        UD04GenerateDocumentResponse res = new UD04GenerateDocumentResponse();
        res.setCode(400);
        res.setMsg(msg);
        return res;
    }
}
