package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;
import java.math.BigDecimal;

/**
 * ADCA Change対象項目テーブル Entity
 * 对应表：HDOC_ADCA_MODIFICATION
 */
@Data
public class HdocAdcaModification {
    /** SERIE */
    private String serie;
    /** CHNO */
    private String chno;
    /** DOCTYPE */
    private String doctype;
    /** LANG */
    private String lang;
    /** VARIABLE */
    private String variable;
    /** VERS */
    private BigDecimal vers;
    /** NEWVAL */
    private String newval;
    /** STA */
    private BigDecimal sta;
    /** BU */
    private String bu;
    /** 发布用户 */
    private String releaseUser;
    /** 发布时间 */
    private LocalDateTime releaseDateTime;
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
