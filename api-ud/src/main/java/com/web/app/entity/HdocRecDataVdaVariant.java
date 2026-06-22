package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * VDA Variant实体类
 * 对应表: HDOC_REC_DATA_VDA_VARIANTS
 */
@Data
public class HdocRecDataVdaVariant implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 底盘编号 */
    private String chassisNo;

    /** Symbol代码 */
    private String symbol;

    /** 描述 */
    private String description;
}
