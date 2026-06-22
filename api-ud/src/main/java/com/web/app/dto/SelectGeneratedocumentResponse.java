package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

/**
 * UD04 - Generate document查询响应DTO
 */
@Data
public class SelectGeneratedocumentResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer code;
    private String msg;
    private SelectGeneratedocumentData data;

    @Data
    public static class SelectGeneratedocumentData implements Serializable {
        private static final long serialVersionUID = 1L;

        private String chassisNo;
        private String ordernumber;
        private String buildWeek;
        private String specWeek;
        private String market;
        private String masterMarket;
        private List<String> sNotes;
        private String sNoteMessage;
        private String frontLoadIndex;
        private String frontSpeedIndex;
        private String driveLoadIndex;
        private String driveSpeedIndex;
        private Boolean adChangeEnabled;
        private String adChangeMessage;
        private String templateName;
        private List<String> replacedParams;
        private String generatedFileUrl;
        private String date;
        private String hdocVersion;
    }
}
