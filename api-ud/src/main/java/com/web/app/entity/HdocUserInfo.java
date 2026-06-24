package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * HDOC用户信息实体类
 * 对应数据库表：hdoc_user_infor
 * 对应SQL：5.1 - selectUserByLoginParam
 */
@Data
public class HdocUserInfo {
    /**
     * 用户ID
     */
    private String userId;
    
    /**
     * 用户名
     */
    private String username;
    
    /**
     * 密码
     */
    private String password;
    
    /**
     * 担当
     */
    private String responsible;
    
    /**
     * 职位（数据库列名：USER_POSITION）
     */
    private String userPosition;
    
    /**
     * 邮箱（数据库列名：EMAIL）
     */
    private String email;
    
    /**
     * 注册时间
     */
    private LocalDateTime registerDatetime;
    
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
    private LocalDateTime updateDatetime;
    
    /**
     * 更新用户
     */
    private String updateUser;
    
    /**
     * 更新程序
     */
    private String updateProcess;
}
