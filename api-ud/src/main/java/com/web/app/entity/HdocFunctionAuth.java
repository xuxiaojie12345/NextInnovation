package com.web.app.entity;

import java.util.Date;

import lombok.Data;

/**
 * 用户功能权限实体类
 * 对应表：react_ud.HDOC_FUNCTION_AUTH（ユーザ機能権限テーブル）
 * 命名规则：表名 HDOC_FUNCTION_AUTH → 驼峰名 HdocFunctionAuth
 */
@Data
public class HdocFunctionAuth {

    /** 用户ID */
    private String userid;

    /** 功能权限（列名：FUNCTION，SQL保留字需转义） */
    private String function;

    /** 注册时间 */
    private Date registerDatetime;

    /** 注册用户 */
    private String registerUser;

    /** 注册程序 */
    private String registerProcess;

    /** 更新时间 */
    private Date updateDatetime;

    /** 更新用户 */
    private String updateUser;

    /** 更新程序 */
    private String updateProcess;
}
