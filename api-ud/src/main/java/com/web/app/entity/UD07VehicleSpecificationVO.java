package com.web.app.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;

/**
 * UD07 车辆规格查询视图对象
 *
 * 功能说明：映射第一次查询的车辆规格主数据
 *
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-22
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UD07VehicleSpecificationVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String model;

    private String customerAdap;

    private String buildWeek;

    private String productType;

    private String vin;

    private String countryOfOperation;

    private String familyId;

    private String variantId;
}
