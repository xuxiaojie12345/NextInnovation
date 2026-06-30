package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;
import java.time.LocalDate;

/**
 * VIN Plate送信データテーブル Entity
 * 对应表：HDOC_SEND_DATA_VIN_PLATE
 */
@Data
public class HdocSendDataVinPlate {
    /** SERIE */
    private String serie;
    /** CHNR */
    private String chnr;
    /** PC */
    private String pc;
    /** ADDED */
    private LocalDate added;
    /** DOC_READY */
    private LocalDate docReady;
    /** DOC_SENT */
    private LocalDate docSent;
    /** BU */
    private String bu;
    /** STATUS */
    private Integer status;
    /** XML_DOC */
    private String xmlDoc;
    /** MSG */
    private String msg;
    /** TYPE */
    private String type;
    /** IS_JS_DIVISION */
    private String isJsDivision;
    /** ORDERNUMBER */
    private String ordernumber;
    /** FILENAME_ON_DISK */
    private String filenameOnDisk;
    /** ADCA_CHANGE_FLG */
    private String adcaChangeFlg;
    /** 注册时间 */
    private LocalDateTime registerDatetime;
    /** 注册用户 */
    private String registerUser;
    /** 注册程序 */
    private String registerProcess;
    /** 更新时间 */
    private LocalDateTime updateDatetime;
    /** 更新用户 */
    private String updateUser;
    /** 更新程序 */
    private String updateProcess;
}
