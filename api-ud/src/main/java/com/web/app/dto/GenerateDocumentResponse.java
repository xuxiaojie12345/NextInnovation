package com.web.app.dto;

import lombok.Data;
@Data
public class GenerateDocumentResponse {
    private String ordernumber;
    private String buildWeek;
    private String specWeek;
    private String market;
    private String noteNo;
    private String loadIndex;
    private Boolean modifyDocLink;
    private ReplacingParam replacingParameters;

    @Data
    public static class ReplacingParam {
        private String variable;
    }

    /**
     * MyBatis 用: ACT(VARCHAR) → Boolean 変換
     */
    public void setAct(String act) {
        this.modifyDocLink = "1".equals(act);
    }
}
