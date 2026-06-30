package com.web.app.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/** UD17: 用户ID请求 */
@Data
public class UserIdRequest {
    @JsonProperty("UserId")
    private String userId;
}
