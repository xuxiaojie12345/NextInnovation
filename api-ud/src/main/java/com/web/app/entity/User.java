package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;
import java.util.Date;

/**
 * 用户信息实体类
 * 对应表: hdoc_user_infor
 */
@Data
public class User implements Serializable {
    private static final long serialVersionUID = 1L;
    
    /**
     * 用户ID
     */
    private String userid;
    
    /**
     * 用户名
     */
    private String username;
    
    /**
     * 密码
     */
    private String password;
}
