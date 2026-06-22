package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * KOLA Variant实体类
 * 对应表: HDOC_REC_DATA_KOLA_VARIANT
 */
@Data
public class HdocRecDataKolaVariant implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 底盘编号 */
    private String chassisNo;

    /** Symbol代码 */
    private String symbol;

    /** Engine No */
    private String engineNo;
}
