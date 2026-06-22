package com.web.app.domain;

import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * ADCA Changeテーブル Entity
 */
@Data
public class HdocAdcaChange implements Serializable {
    private static final long serialVersionUID = 1L;

    private String serie;              // SERIE - 系列编号
    private String chnr;               // CHNR - 频道编号
    private String act;                // ACT - 激活状态
    private String bu;                 // BU - 业务单元
    private String reason;             // REASON - 原因
    private LocalDateTime registerDatetime; // REGISTER_DATETIME - 注册时间
    private String registerUser;       // REGISTER_USER - 注册用户
    private String registerProcess;    // REGISTER_PROCESS - 注册程序
    private LocalDateTime updateDatetime;   // UPDATE_DATETIME - 更新时间
    private String updateUser;         // UPDATE_USER - 更新用户
    private String updateProcess;      // UPDATE_PROCESS - 更新程序
}
