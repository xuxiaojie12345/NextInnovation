package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * VDA受信データ(GeneralInformation) Entity
 * 对应表：HDOC_REC_DATA_VDA_GENERAL
 */
@Data
public class HdocRecDataVdaGeneral {
    /** 系列 */
    private String serie;
    /** 频道编号 */
    private String chnr;
    /** 传输时间戳 */
    private String transTs;
    /** 车辆识别码 */
    private String vin;
    /** 运营国家 */
    private String countryOfOperation;
    /** 注册号 */
    private String registrationNumber;
    /** 交付日期 */
    private String deliveryDate;
    /** 品牌ID */
    private String brandId;
    /** PC */
    private String pc;
    /** 产品类型 */
    private String productType;
    /** 公司代码 */
    private String companyCode;
    /** 营销类型 */
    private String marketingType;
    /** 主规格周 */
    private String mainSpecWeek;
    /** 车身规格周 */
    private String bodySpecWeek;
    /** 制造周 */
    private String buildWeek;
    /** 最终客户ID */
    private String usingEndCustomerId;
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
