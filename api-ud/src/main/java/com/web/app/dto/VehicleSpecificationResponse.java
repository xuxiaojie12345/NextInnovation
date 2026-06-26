package com.web.app.dto;

import lombok.Data;
import java.math.BigDecimal;

/** UD07: 车辆规格响应 */
@Data
public class VehicleSpecificationResponse {
    private String model;
    private BigDecimal build;
    private String productType;
    private String vin;
    private String symbol;
    private String countryOfOperation;
    private String symbolSpace;
    private String description;
    private String customerAdap;
    private String familyId;
    private String variantId;
    private String functionId;
}
