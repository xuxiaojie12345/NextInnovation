package com.web.app.entity;

/**
 * hdoc_user_infor 实体类
 * 用户信息表
 */
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

    /** 邮箱 */
    private String eMmail;

    public HdocUserInfor() {}

    public String getUserid() {
        return userid;
    }

    public void setUserid(String userid) {
        this.userid = userid;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getResponsible() {
        return responsible;
    }

    public void setResponsible(String responsible) {
        this.responsible = responsible;
    }

    public String getUserposition() {
        return userposition;
    }

    public void setUserposition(String userposition) {
        this.userposition = userposition;
    }

    public String geteMmail() {
        return eMmail;
    }

    public void seteMmail(String eMmail) {
        this.eMmail = eMmail;
    }
}
