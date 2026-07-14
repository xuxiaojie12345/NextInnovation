package com.web.app.domain.Entity;

import lombok.Data;

/**
 * HDOC Send Data VIN Plate Entity
 * 对应 HDOC_SEND_DATA_VIN_PLATE 表
 */
@Data
public class HdocSendDataVinPlate {
    private String serie;           // SERIE
    private String chnr;            // CHNR (Chassis number)
    private String type;            // TYPE
    private String status;          // STATUS
    private String msg;             // MSG (Error Message)
    private String registerDatetime;// REGISTER_DATETIME
    private String docReady;        // DOC_READY
    private String docSent;         // DOC_SENT
    private String xmlDoc;          // XML_DOC
    private String updateDatetime;  // UPDATE_DATETIME
    private String updateUser;      // UPDATE_USER
    private String updateProcess;   // UPDATE_PROCESS
}
