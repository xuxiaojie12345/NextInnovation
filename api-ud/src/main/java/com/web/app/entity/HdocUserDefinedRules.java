package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * 用户定义规则实体类
 * 对应表: HDOC_USER_DEFINED_RULES
 */
@Data
public class HdocUserDefinedRules implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 产品类别 (PK) */
    private String pc;

    /** 序号 (PK) */
    private String num;

    /** 市场 (PK) */
    private String market;

    /** VS - 不可为空 */
    private String vs;

    /** VS2 */
    private String vs2;

    /** 变量 - 不可为空 */
    private String variable;

    /** 值 - 不可为空 */
    private String val;

    /** 用户ID */
    private String userId;

    /** 更新日期 */
    private String upDate;

    /** 备注 */
    private String comments;

    /** 添加日期 YYYYWW */
    private String addDate;

    /** 删除日期 YYYYWW */
    private String deleteDate;

    /** 注册时间 - 不可为空 */
    private String registerDatetime;

    /** 注册用户 - 不可为空 */
    private String registerUser;

    /** 注册程序 - 不可为空 */
    private String registerProcess;

    /** 更新时间 - 不可为空 */
    private String updateDatetime;

    /** 更新用户 - 不可为空 */
    private String updateUser;

    /** 更新程序 - 不可为空 */
    private String updateProcess;
}
