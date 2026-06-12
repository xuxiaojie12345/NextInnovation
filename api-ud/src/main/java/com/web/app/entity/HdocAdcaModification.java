package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * ADCA修改实体类
 * 对应表: HDOC_ADCA_MODIFICATION
 */
@Data
public class HdocAdcaModification implements Serializable {
    private static final long serialVersionUID = 1L;
    
    /**
     * Serie
     */
    private String serie;
    
    /**
     * Chassis Number
     */
    private String chno;
    
    /**
     * 变量
     */
    private String variable;
    
    /**
     * 描述
     */
    private String description;
    
    /**
     * 新值
     */
    private String newval;
}
