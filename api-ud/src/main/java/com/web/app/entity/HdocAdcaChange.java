package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * ADCA Changeテーブル Entity
 * 对应表：HDOC_ADCA_CHANGE
 */
@Data
public class HdocAdcaChange {
    /** SERIE */
    private String serie;
    /** CHNR */
    private String chnr;
    /** ACT */
    private String act;
    /** BU */
    private String bu;
    /** REASON */
    private String reason;
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
