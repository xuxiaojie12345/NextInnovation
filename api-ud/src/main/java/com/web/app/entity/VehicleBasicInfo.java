package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * 车辆基本信息实体（UD07-5.6-1查询结果）
 */
@Data
public class VehicleBasicInfo implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 系列ID */
    private String familyId;

    /** 变体ID */
    private String variantId;

    /** 车型 */
    private String model;

    /** 生产周 */
    private String builtWeek;

    /** 客户适配信息 */
    private String customerAdap;

    /** 产品类型 */
    private String productType;

    /** VIN号 */
    private String vin;

    /** 运营国家 */
    private String countryOfOperation;
}
