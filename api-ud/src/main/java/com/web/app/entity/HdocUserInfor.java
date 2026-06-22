package com.web.app.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;
import java.util.Date;

/**
 * 用户信息实体类
 * 对应数据库表: HDOC_USER_INFOR
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HdocUserInfor implements Serializable {
    
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
}
