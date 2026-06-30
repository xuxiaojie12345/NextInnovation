package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;
import java.math.BigDecimal;

/**
 * HDOC_USER_DEFINED_RULES Entity
 */
@Data
public class HdocUserDefinedRules {
    /** PC代码 */
    private String pc;
    /** 序号 */
    private BigDecimal num;
    /** 市场 */
    private String market;
    /** VS */
    private String vs;
    /** VS2 */
    private String vs2;
    /** 变量 */
    private String variable;
    /** 值 */
    private String val;
    /** 用户ID */
    private String userid;
    /** 更新日期 */
    private String upDate;
    /** 备注 */
    private String comments;
    /** 添加日期 */
    private String addDate;
    /** 删除日期 */
    private String deleteDate;
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
