package com.web.app.domain;

import lombok.Data;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * OM(RP500)受信データ Entity
 */
@Data
public class HdocRecDataOm implements Serializable {
    private static final long serialVersionUID = 1L;

    private String ordernumber;        // ORDERNUMBER - 订单编号
    private String transTs;            // TRANS_TS - 传输时间戳
    private String salesmarket;        // SALESMARKET - 销售市场
    private String buyerpartyid;       // BUYERPARTYID - 买家ID
    private String endcustomerpartyid; // ENDCUSTOMERPARTYID - 最终客户ID
    private String dealagreementid;    // DEALAGREEMENTID - 交易协议ID
    private BigDecimal spec;           // SPEC - 规格
    private BigDecimal build;          // BUILD - 版本
    private String serie;              // SERIE - 系列
    private String chnr;               // CHNR - 频道编号
    private BigDecimal delivery;       // DELIVERY - 交付
    private String model;              // MODEL - 车型
    private String vin;                // VIN - 车辆识别码
    private String customerAdap;       // CUSTOMER_ADAP - 客户适配
    private String varstr;             // VARSTR - 变量字符串
    private String symbolStr;          // SYMBOL_STR - 符号字符串
    private String orderstatus;        // ORDERSTATUS - 订单状态
    private String assemblyOrder;      // ASSEMBLY_ORDER - 装配订单
    private String facLine;            // FAC_LINE - 工厂产线
    private String regdate;            // REGDATE - 注册日期
    private String pc;                 // PC - PC
    private String nsvDescr;           // NSV_DESCR - NSV描述
    private BigDecimal firmPlan;       // FIRM_PLAN - 固定计划
    private BigDecimal vstatus;        // VSTATUS - 状态
    private BigDecimal lastCd;         // LAST_CD - 最后代码
    private String fo;                 // FO - FO
    private String productionEnd;      // PRODUCTION_END - 生产结束
    private String buyerpartyid2;      // BUYERPARTYID2 - 买家ID2
    private String tdiDealerid;        // TDI_DEALERID - TDI经销商ID
    private String releasefactory;     // RELEASEFACTORY - 发布工厂
    private String retailsalesdate;    // RETAILSALESDATE - 零售日期
    private LocalDateTime registerDatetime; // REGISTER_DATETIME - 注册时间
    private String registerUser;       // REGISTER_USER - 注册用户
    private String registerProcess;    // REGISTER_PROCESS - 注册程序
    private LocalDateTime updateDatetime;   // UPDATE_DATETIME - 更新时间
    private String updateUser;         // UPDATE_USER - 更新用户
    private String updateProcess;      // UPDATE_PROCESS - 更新程序
}
