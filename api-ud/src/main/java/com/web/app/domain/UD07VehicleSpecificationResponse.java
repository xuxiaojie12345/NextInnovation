package com.web.app.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.io.Serializable;

/**
 * UD07_VehicleSpecification - 车辆规格响应对象
 */
@Data
public class UD07VehicleSpecificationResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private String model;                // 车型
    private String builtWeek;            // 生产周
    private String productType;          // 产品类型
    private String vin;                  // VIN码
    private String engineNo;             // 发动机号
    private String countryOfOperation;   // 运营国家
    private String symbolStr;            // 格式化后的符号字符串
    private String description;          // 描述
    @JsonProperty("sNoteNo")
    private String sNoteNo;              // S-Note编号
}
