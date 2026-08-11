package com.web.app.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

/**
 * Generate Document 模块 (UD04) 返回给前端的 DocumentData 结构。
 * 字段与前端 react-ud/src/GenerateDocument/GenerateDocument.tsx 的 DocumentData 接口一一对应。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDataResponse {

    /** 替换参数项 */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReplacingParameter {
        private String variable;
        private String newVal;
    }

    private String chassisInfo;
    private String ordernumber;
    private Object buildWeek;
    private Object specWeek;
    private String market;
    private String masterMarket;
    private String loadIndex;
    private Boolean adChangeActive;
    private String modifyLinkText;
    private String usingTemplate;
    private List<ReplacingParameter> replacingParameters;
    private String generatedFileUrl;
    private String serverDate;

    // ---------- 以下三个字段手动编写 getter/setter，固定 JSON 字段名与前端一致 ----------
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private String sNoteNo;

    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private String sNoteMessage;

    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private String hDocVersion;

    @JsonProperty("sNoteNo")
    public String getSNoteNo() {
        return sNoteNo;
    }

    @JsonProperty("sNoteNo")
    public void setSNoteNo(String sNoteNo) {
        this.sNoteNo = sNoteNo;
    }

    @JsonProperty("sNoteMessage")
    public String getSNoteMessage() {
        return sNoteMessage;
    }

    @JsonProperty("sNoteMessage")
    public void setSNoteMessage(String sNoteMessage) {
        this.sNoteMessage = sNoteMessage;
    }

    @JsonProperty("hDocVersion")
    public String getHDocVersion() {
        return hDocVersion;
    }

    @JsonProperty("hDocVersion")
    public void setHDocVersion(String hDocVersion) {
        this.hDocVersion = hDocVersion;
    }
}
