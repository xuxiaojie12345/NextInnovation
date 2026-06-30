package com.web.app.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/** UD16: ADCA Change请求 */
@Data
public class AdcaChangeRequest {
    @JsonProperty("SerieChnr")
    private String serieChnr;
    @JsonProperty("Desc")
    private String desc;
    @JsonProperty("RegisterUser")
    private String registerUser;
    @JsonProperty("RegisterDatetime")
    private String registerDatetime;
    @JsonProperty("RegisterProcess")
    private String registerProcess;
    @JsonProperty("UpdateUser")
    private String updateUser;
    @JsonProperty("UpdateDatetime")
    private String updateDatetime;
    @JsonProperty("UpdateProcess")
    private String updateProcess;
}
