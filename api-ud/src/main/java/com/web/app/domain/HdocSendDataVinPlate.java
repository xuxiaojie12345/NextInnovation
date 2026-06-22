package com.web.app.domain;

import lombok.Data;
import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * VIN Plate送信データテーブル Entity
 */
@Data
public class HdocSendDataVinPlate implements Serializable {
    private static final long serialVersionUID = 1L;

    private String serie;              // SERIE - 系列
    private String chnr;               // CHNR - 频道编号
    private String pc;                 // PC - PC
    private LocalDate added;           // ADDED - 添加日期
    private LocalDate docReady;        // DOC_READY - 文档就绪日期
    private LocalDate docSent;         // DOC_SENT - 文档发送日期
    private String bu;                 // BU - 业务单元
    private Integer status;            // STATUS - 状态
    private String xmlDoc;             // XML_DOC - XML文档
    private String msg;                // MSG - 消息
    private String type;               // TYPE - 类型
    private String isJsDivision;       // IS_JS_DIVISION - 是否JS部门
    private String ordernumber;        // ORDERNUMBER - 订单编号
    private String filenameOnDisk;     // FILENAME_ON_DISK - 磁盘文件名
    private String adcaChangeFlg;      // ADCA_CHANGE_FLG - ADCA变更标志
    private LocalDateTime registerDatetime; // REGISTER_DATETIME - 注册时间
    private String registerUser;       // REGISTER_USER - 注册用户
    private String registerProcess;    // REGISTER_PROCESS - 注册程序
    private LocalDateTime updateDatetime;   // UPDATE_DATETIME - 更新时间
    private String updateUser;         // UPDATE_USER - 更新用户
    private String updateProcess;      // UPDATE_PROCESS - 更新程序
}
