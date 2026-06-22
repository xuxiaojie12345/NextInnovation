package com.web.app.domain;

import lombok.Data;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * ADCA Change対象項目テーブル Entity
 */
@Data
public class HdocAdcaModification implements Serializable {
    private static final long serialVersionUID = 1L;

    private String serie;              // SERIE - 系列编号
    private String chno;               // CHNO - 频道编号
    private String doctype;            // DOCTYPE - 文档类型
    private String lang;               // LANG - 语言
    private String variable;           // VARIABLE - 变量名
    private BigDecimal vers;           // VERS - 版本号
    private String newval;             // NEWVAL - 新值
    private BigDecimal sta;            // STA - 状态
    private String bu;                 // BU - 业务单元
    private String releaseUser;        // RELEASE_USER - 发布用户
    private LocalDateTime releaseDateTime; // RELEASE_DATE_TIME - 发布时间
    private LocalDateTime registerDatetime; // REGISTER_DATETIME - 注册时间
    private String registerUser;       // REGISTER_USER - 注册用户
    private String registerProcess;    // REGISTER_PROCESS - 注册程序
    private LocalDateTime updateDatetime;   // UPDATE_DATETIME - 更新时间
    private String updateUser;         // UPDATE_USER - 更新用户
    private String updateProcess;      // UPDATE_PROCESS - 更新程序
}
