package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * 用户功能权限实体类
 * 对应表: HDOC_FUNCTION_AUTH
 */
@Data
public class HdocFunctionAuth implements Serializable {
    private static final long serialVersionUID = 1L;
    
    /**
     * 用户ID
     */
    private String userid;
    
    /**
     * 功能
     */
    private String function;
}
