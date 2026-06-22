package com.web.app.domain;

import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * ユーザmarket権限テーブル Entity
 */
@Data
public class HdocMarketAuth implements Serializable {
    private static final long serialVersionUID = 1L;

    private String userid;             // USERID - 用户ID
    private String market;             // MARKET - 市场
    private String type;               // TYPE - 类型
    private String bu;                 // BU - 业务单元
    private LocalDateTime registerDatetime; // REGISTER_DATETIME - 注册时间
    private String registerUser;       // REGISTER_USER - 注册用户
    private String registerProcess;    // REGISTER_PROCESS - 注册程序
    private LocalDateTime updateDatetime;   // UPDATE_DATETIME - 更新时间
    private String updateUser;         // UPDATE_USER - 更新用户
    private String updateProcess;      // UPDATE_PROCESS - 更新程序
}
