package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * 产品类别主数据实体类
 * 对应表: PRODUCT_CLASS_MASTER
 */
@Data
public class ProductClassMaster implements Serializable {
    private static final long serialVersionUID = 1L;
    
    /**
     * 产品类别
     */
    private String pc;
    
    /**
     * 描述
     */
    private String description;
}
