package com.web.app.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * HDOC_ADCA_CHANGE 实体类
 *
 * AD/CA变更记录表
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HdocAdcaChange implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 系列 */
    private String serie;

    /** 底盘号 */
    private String chnr;

    /** 活性标志 */
    private String act;

    /** BU */
    private String bu;

    /** 变更理由 */
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
