package com.web.app.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/** UD15: VIN Plate Type变更请求 */
@Data
public class VinPlateTypeRequest {
    @JsonProperty("ChassisNumber")
    private String chassisNumber;
    @JsonProperty("Type")
    private String type;
    @JsonProperty("Status")
    private String status;
    @JsonProperty("UpdateUser")
    private String updateUser;
    @JsonProperty("UpdateDatetime")
    private String updateDatetime;
    @JsonProperty("UpdateProcess")
    private String updateProcess;
}
