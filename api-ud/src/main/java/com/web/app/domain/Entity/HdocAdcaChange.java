package com.web.app.domain.Entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * HDOC ADCA Change Entity
 * 对应 HDOC_ADCA_CHANGE 表
 */
@Data
public class HdocAdcaChange {
    private String serie;           // SERIE
    private String chnr;            // CHNR
    private String act;             // ACT (Y/N)
    private String bu;              // BU
    private String reason;          // REASON
    private String registerDatetime;// REGISTER_DATETIME
    private String registerUser;    // REGISTER_USER
    private String registerProcess; // REGISTER_PROCESS
    private String updateDatetime;  // UPDATE_DATETIME
    private String updateUser;      // UPDATE_USER
    private String updateProcess;   // UPDATE_PROCESS

    // 前端传入字段
    @JsonProperty("serieChnr")
    private String serieChnr;       // 前端传入的 "SERIE-CHNR" 組合
    @JsonProperty("desc")
    private String desc;            // 前端传入的 Desc（= REASON）
}
