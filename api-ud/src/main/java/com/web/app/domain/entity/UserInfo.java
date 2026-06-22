package com.web.app.domain.entity;

import java.io.Serializable;
import java.util.Date;

/**
 * 用户信息实体类
 * 对应数据库表: hdoc_user_infor
 */
public class UserInfo implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 用户ID
     */
    private String userid;
    
    /**
     * 密码
     */
    private String password;
    
    /**
     * 用户名
     */
    private String username;
    
    /**
     * 负责人
     */
    private String responsible;
    
    /**
     * 用户职位
     */
    private String userposition;
    
    /**
     * 邮箱
     */
    private String email;
    
    /**
     * 注册时间
     */
    private Date registerDatetime;
    
    /**
     * 注册用户
     */
    private String registerUser;
    
    /**
     * 注册程序
     */
    private String registerProcess;
    
    /**
     * 更新时间
     */
    private Date updateDatetime;
    
    /**
     * 更新用户
     */
    private String updateUser;
    
    /**
     * 更新程序
     */
    private String updateProcess;
    
    // Getter and Setter methods
    
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
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public Date getRegisterDatetime() {
        return registerDatetime;
    }
    
    public void setRegisterDatetime(Date registerDatetime) {
        this.registerDatetime = registerDatetime;
    }
    
    public String getRegisterUser() {
        return registerUser;
    }
    
    public void setRegisterUser(String registerUser) {
        this.registerUser = registerUser;
    }
    
    public String getRegisterProcess() {
        return registerProcess;
    }
    
    public void setRegisterProcess(String registerProcess) {
        this.registerProcess = registerProcess;
    }
    
    public Date getUpdateDatetime() {
        return updateDatetime;
    }
    
    public void setUpdateDatetime(Date updateDatetime) {
        this.updateDatetime = updateDatetime;
    }
    
    public String getUpdateUser() {
        return updateUser;
    }
    
    public void setUpdateUser(String updateUser) {
        this.updateUser = updateUser;
    }
    
    public String getUpdateProcess() {
        return updateProcess;
    }
    
    public void setUpdateProcess(String updateProcess) {
        this.updateProcess = updateProcess;
    }
}
