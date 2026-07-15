package com.web.app.domain.Entity;

import lombok.Data;

/**
 * HDOC Send Data VIN Plate Entity
 * 对应 HDOC_SEND_DATA_VIN_PLATE 表
 */
@Data
public class HdocSendDataVinPlate {
    private String serie;          
    private String chnr;            
    private String type;         
    private String status;    
    private String msg;         
    private String registerDatetime;
    private String docReady;    
    private String docSent;     
    private String xmlDoc;   
    private String updateDatetime;  
    private String updateUser;     
    private String updateProcess;  
}
