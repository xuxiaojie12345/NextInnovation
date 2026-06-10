package com.web.app.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * UD07 Vehicle Specification Response
 * 车辆规格信息查询响应对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UD07VehicleSpecificationResponse {
    
    /**
     * 车辆基础信息
     */
    private VehicleInfo vehicleInfo;
    
    /**
     * VDA变体信息列表
     */
    private VariantInfo variantInfo;
    
    /**
     * 发动机编号
     */
    private String engineNo;
    
    /**
     * 车辆基础信息内部类
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VehicleInfo {
        private String model;                // Model
        private String builtWeek;            // Built week
        private String customerAdap;         // CUSTOMER_ADAP (S-Note NO)
        private String productType;          // Product type
        private String vin;                  // VIN
        private String countryOfOperation;   // Country of Operation
        private String familyId;             // FAMILY_ID
        private String variantId;            // VARIANT_ID
    }
    
    /**
     * VDA变体信息内部类
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantInfo {
        private List<VariantItem> list;      // 变体符号列表
    }
    
    /**
     * 单个变体项
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantItem {
        private String symbol;               // SYMBOL_PREFIX (前8位)
        private String description;          // DESCRIPTION
        private String functionGroup;        // FUNCTION_GROUP (用于排序)
    }
}
