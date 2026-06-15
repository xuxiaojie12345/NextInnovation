package com.web.app.domain.Entity;

import lombok.Data;

/**
 * Product Class Master Entity
 * 产品类别主数据实体类，对应 PRODUCT_CLASS_MASTER 表
 */
@Data
public class ProductClassMaster {
    private String pc;              // Product class code
    private String productName;     // Product name
}
