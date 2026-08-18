package com.web.app.entity;

import java.util.Date;

import lombok.Data;

/**
 * 用户Market权限实体类
 * 对应表：react_ud.HDOC_MARKET_AUTH（ユーザmarket権限テーブル）
 * 命名规则：表名 HDOC_MARKET_AUTH → 驼峰名 HdocMarketAuth
 */
@Data
public class HdocMarketAuth {

    /** 用户ID */
    private String userid;

    /** 市场 */
    private String market;

    /** 类型 */
    private String type;

    /** 业务单元 */
    private String bu;

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
