package com.web.app.entity;

import java.util.Date;

import lombok.Data;

/**
 * 用户信息实体类
 * 对应表：react_ud.hdoc_user_infor（ユーザー情報テーブル）
 * 命名规则：表名 hdoc_user_infor → 驼峰名 HdocUserInfor
 */
@Data
public class HdocUserInfor {

    /** 用户ID */
    private String userid;

    /** 密码 */
    private String password;

    /** 用户名 */
    private String username;

    /** 担当 */
    private String responsible;

    /** 职位 */
    private String userposition;

    /** 邮箱（列名：E-MMAIL） */
    private String eMmail;

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
