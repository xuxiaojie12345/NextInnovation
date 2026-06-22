package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD07 - Vehicle Specification查询请求DTO
 */
@Data
public class UD07VehicleSpecificationRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 底盘编号 */
    private String chassisNo;
}
