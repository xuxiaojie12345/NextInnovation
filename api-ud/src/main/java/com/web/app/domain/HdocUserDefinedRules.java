package com.web.app.domain;

import lombok.Data;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * HDOC_USER_DEFINED_RULES Entity
 */
@Data
public class HdocUserDefinedRules implements Serializable {
    private static final long serialVersionUID = 1L;

    private String pc;                 // PC - PC代码
    private BigDecimal num;            // NUM - 序号
    private String market;             // MARKET - 市场
    private String vs;                 // VS - VS
    private String vs2;                // VS2 - VS2
    private String variable;           // VARIABLE - 变量
    private String val;                // VAL - 值
    private String userid;             // USERID - 用户ID
    private String upDate;             // UP_DATE - 更新日期
    private String comments;           // COMMENTS - 备注
    private String addDate;            // ADD_DATE - 添加日期
    private String deleteDate;         // DELETE_DATE - 删除日期
    private LocalDateTime registerDatetime; // REGISTER_DATETIME - 注册时间
    private String registerUser;       // REGISTER_USER - 注册用户
    private String registerProcess;    // REGISTER_PROCESS - 注册程序
    private LocalDateTime updateDatetime;   // UPDATE_DATETIME - 更新时间
    private String updateUser;         // UPDATE_USER - 更新用户
    private String updateProcess;      // UPDATE_PROCESS - 更新程序
}
