package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;
import java.math.BigDecimal;

/**
 * OM(RP500)受信データ Entity
 * 对应表：HDOC_REC_DATA_OM
 */
@Data
public class HdocRecDataOm {
    /** 订单编号 */
    private String ordernumber;
    /** 传输时间戳 */
    private String transTs;
    /** 销售市场 */
    private String salesmarket;
    /** 买家ID */
    private String buyerpartyerId;
    /** 最终客户ID */
    private String endcustomerpartyerId;
    /** 交易协议ID */
    private String dealagreementId;
    /** 规格 */
    private BigDecimal spec;
    /** 版本 */
    private BigDecimal build;
    /** 系列 */
    private String serie;
    /** 频道编号 */
    private String chnr;
    /** 交付 */
    private BigDecimal delivery;
    /** 车型 */
    private String model;
    /** 车辆识别码 */
    private String vin;
    /** 客户适配 */
    private String customerAdap;
    /** 变量字符串 */
    private String varstr;
    /** 符号字符串 */
    private String symbolStr;
    /** 订单状态 */
    private String orderstatus;
    /** 装配订单 */
    private String assemblyOrder;
    /** 工厂产线 */
    private String facLine;
    /** 注册日期 */
    private String regdate;
    /** PC */
    private String pc;
    /** NSV描述 */
    private String nsvDescr;
    /** 固定计划 */
    private BigDecimal firmPlan;
    /** 状态 */
    private BigDecimal vstatus;
    /** 最后代码 */
    private BigDecimal lastCd;
    /** FO */
    private String fo;
    /** 生产结束 */
    private String productionEnd;
    /** 买家ID2 */
    private String buyerpartyerId2;
    /** TDI经销商ID */
    private String tdiDealerId;
    /** 发布工厂 */
    private String releasefactory;
    /** 零售日期 */
    private String retailSalesDate;
    /** 注册时间 */
    private LocalDateTime registerDatetime;
    /** 注册用户 */
    private String registerUser;
    /** 注册程序 */
    private String registerProcess;
    /** 更新时间 */
    private LocalDateTime updateDatetime;
    /** 更新用户 */
    private String updateUser;
    /** 更新程序 */
    private String updateProcess;
}
