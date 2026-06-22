package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * OM受信データ实体类
 * 对应表: HDOC_REC_DATA_OM
 */
@Data
public class HdocRecDataOm implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 系列 */
    private String serie;

    /** 底盘号 */
    private String chnr;

    /** 底盘编号（完整） */
    private String chassisNo;

    /** 订单号 */
    private String ordernumber;

    /** 市场 */
    private String market;

    /** 车型 */
    private String model;

    /** 生产周 */
    private String build;

    /** Spec周 */
    private String specWeek;

    /** 客户适配信息（S-Notes） */
    private String customerAdap;
}
