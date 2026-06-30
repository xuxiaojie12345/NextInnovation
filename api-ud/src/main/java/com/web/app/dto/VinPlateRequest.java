package com.web.app.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/** UD15: VIN Plate请求 */
@Data
public class VinPlateRequest {
    @JsonProperty("ChassisNumber")
    private String chassisNumber;
}
