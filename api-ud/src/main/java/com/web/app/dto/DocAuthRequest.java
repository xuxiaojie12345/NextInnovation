package com.web.app.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/** UD18: 文档权限请求 */
@Data
public class DocAuthRequest {
    @JsonProperty("userId")
    private String userId;
    @JsonProperty("doctype")
    private String doctype;
    @JsonProperty("registerUser")
    private String registerUser;
    @JsonProperty("registerDatetime")
    private String registerDatetime;
    @JsonProperty("registerProcess")
    private String registerProcess;
    @JsonProperty("updateUser")
    private String updateUser;
    @JsonProperty("updateDatetime")
    private String updateDatetime;
    @JsonProperty("updateProcess")
    private String updateProcess;
}
