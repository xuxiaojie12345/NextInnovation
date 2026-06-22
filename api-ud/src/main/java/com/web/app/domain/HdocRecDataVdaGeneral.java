package com.web.app.domain;

import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * VDA受信データ(GeneralInformation) Entity
 */
@Data
public class HdocRecDataVdaGeneral implements Serializable {
    private static final long serialVersionUID = 1L;

    private String serie;              // SERIE - 系列
    private String chnr;               // CHNR - 频道编号
    private String transTs;            // TRANS_TS - 传输时间戳
    private String vin;                // VIN - 车辆识别码
    private String countryOfOperation; // COUNTRY_OF_OPERATION - 运营国家
    private String registrationNumber; // REGISTRATION_NUMBER - 注册号
    private String deliveryDate;       // DELIVERY_DATE - 交付日期
    private String brandId;            // BRAND_ID - 品牌ID
    private String pc;                 // PC - PC
    private String productType;        // PRODUCT_TYPE - 产品类型
    private String companyCode;        // COMPANY_CODE - 公司代码
    private String marketingType;      // MARKETING_TYPE - 营销类型
    private String mainSpecWeek;       // MAIN_SPEC_WEEK - 主规格周
    private String bodySpecWeek;       // BODY_SPEC_WEEK - 车身规格周
    private String buildWeek;          // BUILD_WEEK - 制造周
    private String usingEndCustomerId; // USING_END_CUSTOMER_ID - 最终客户ID
    private LocalDateTime registerDatetime; // REGISTER_DATETIME - 注册时间
    private String registerUser;       // REGISTER_USER - 注册用户
    private String registerProcess;    // REGISTER_PROCESS - 注册程序
    private LocalDateTime updateDatetime;   // UPDATE_DATETIME - 更新时间
    private String updateUser;         // UPDATE_USER - 更新用户
    private String updateProcess;      // UPDATE_PROCESS - 更新程序
}
