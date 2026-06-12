package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * 用户文档权限实体类
 * 对应表: HDOC_USER_DOC
 */
@Data
public class HdocUserDoc implements Serializable {
    private static final long serialVersionUID = 1L;
    
    /**
     * 用户ID
     */
    private String userid;
    
    /**
     * 文档类型
     */
    private String doctype;
    
    /**
     * 注册时间
     */
    private String registerDatetime;
    
    /**
     * 注册用户
     */
    private String registerUser;
}
