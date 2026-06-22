package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD07 - Vehicle Specification查询响应DTO
 */
@Data
public class UD07VehicleSpecificationResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer code;
    private String msg;
    private Object data;
}
