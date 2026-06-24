package com.web.app.entity;

import lombok.Data;
import java.util.Date;

/**
 * 用户实体类
 * 
 * @description 对应数据库表HDOC_USER_INFOR
 */
@Data
public class User {
    
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
     * 邮箱
     */
    private String email;
    
    /**
     * 负责人
     */
    private String responsible;
    
    /**
     * 用户职位
     */
    private String userPosition;
    
    /**
     * 创建时间
     */
    private Date createTime;
    
    /**
     * 更新时间
     */
    private Date updateTime;
    
    /**
     * 状态（0:禁用 1:启用）
     */
    private Integer status;
}
