package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * VDA General受信データ实体类
 * 对应表: HDOC_REC_DATA_VDA_GENERAL
 */
@Data
public class HdocRecDataVdaGeneral implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 系列 */
    private String serie;

    /** 底盘号 */
    private String chnr;

    /** VIN号 */
    private String vin;

    /** 产品类型 */
    private String productType;

    /** 运营国家 */
    private String countryOfOperation;

    /** 订单号 */
    private String ordernumber;

    /** 市场 */
    private String market;
}
