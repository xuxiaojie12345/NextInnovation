package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * HDoc变量实体类
 * 对应表: HDOC_VARIABLES
 */
@Data
public class HdocVariables implements Serializable {
    private static final long serialVersionUID = 1L;
    
    /**
     * 变量名
     */
    private String variable;
    
    /**
     * 类型
     */
    private String type;
    
    /**
     * 描述
     */
    private String description;
    
    /**
     * 创建用户
     */
    private String createdByUser;
    
    /**
     * 创建日期
     */
    private String createDate;
}
