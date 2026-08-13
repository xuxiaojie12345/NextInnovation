package com.web.app.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleSpecificationResponse {
    private String chassisNo;
    private String model;
    private String builtWeek;
    private String productType;
    private String vin;
    private String engineNo;
    private String countryOfOperation;

    // sNoteNo/sNoteDesc：Jackson 对 Lombok getter 派生会输出 "snoteNo"/"snoteDesc"，
    // 因此关闭 Lombok 生成、手写带 @JsonProperty 的 getter/setter，固定为前端期望的字段名
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private String sNoteNo;

    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private String sNoteDesc;

    @JsonProperty("sNoteNo")
    public String getSNoteNo() { return sNoteNo; }

    @JsonProperty("sNoteNo")
    public void setSNoteNo(String sNoteNo) { this.sNoteNo = sNoteNo; }

    @JsonProperty("sNoteDesc")
    public String getSNoteDesc() { return sNoteDesc; }

    @JsonProperty("sNoteDesc")
    public void setSNoteDesc(String sNoteDesc) { this.sNoteDesc = sNoteDesc; }

    private List<SymbolItem> symbolList;
    private String symbolStr;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SymbolItem {
        private String display;
        private String description;
        private String sortKey;
    }
}
