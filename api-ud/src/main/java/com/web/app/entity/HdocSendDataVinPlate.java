package com.web.app.entity;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HdocSendDataVinPlate {
    private String serie;
    private String chnr;
    private String pc;
    private String added;
    private String docReady;
    private String docSent;
    private String bu;
    private Long status;
    private String xmlDoc;
    private String msg;
    private String typeField;
    private String isJsDivision;
    private String ordernumber;
    private String filenameOnDisk;
    private String adcaChangeFlg;
    private Date registerDatetime;
    private String registerUser;
    private String registerProcess;
    private Date updateDatetime;
    private String updateUser;
    private String updateProcess;
}
