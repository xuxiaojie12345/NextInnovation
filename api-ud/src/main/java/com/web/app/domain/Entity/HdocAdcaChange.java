package com.web.app.domain.Entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * HDOC ADCA Change Entity
 * 对应 HDOC_ADCA_CHANGE 表
 */
@Data
public class HdocAdcaChange {
    private String serie;           
    private String chnr;            
    private String act;             
    private String bu;             
    private String reason;          
    private String registerDatetime;
    private String registerUser;    
    private String registerProcess; 
    private String updateDatetime;  
    private String updateUser;     
    private String updateProcess;   

    // 前端传入字段
    @JsonProperty("serieChnr")
    private String serieChnr;       // 前端传入的 "SERIE-CHNR" 組合
    @JsonProperty("desc")
    private String desc;            // 前端传入的 Desc（= REASON）
}
