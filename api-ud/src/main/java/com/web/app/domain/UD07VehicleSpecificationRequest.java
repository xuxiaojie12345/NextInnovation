package com.web.app.domain;

import lombok.Data;

/**
 * UD07 Vehicle Specification Request
 * 车辆规格信息查询请求对象
 */
@Data
public class UD07VehicleSpecificationRequest {
    
    /**
     * Chassis no (完整的底盘号，包含空格)
     * 例如: "JPCT 013945"
     */
    private String chassisNo;
}
