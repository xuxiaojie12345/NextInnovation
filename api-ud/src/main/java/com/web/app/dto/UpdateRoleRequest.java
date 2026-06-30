package com.web.app.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

/** UD17: 角色更新请求 */
@Data
public class UpdateRoleRequest {
    @JsonProperty("userId")
    private String userId;
    @JsonProperty("updateUser")
    private String updateUser;
    @JsonProperty("updateProcess")
    private String updateProcess;
    @JsonProperty("marketAuthList")
    private List<MarketAuthItem> marketAuthList;
    @JsonProperty("functionAuthList")
    private List<FunctionAuthItem> functionAuthList;

    @Data
    public static class MarketAuthItem {
        @JsonProperty("type")
        private String type;
        @JsonProperty("market")
        private String market;
    }

    @Data
    public static class FunctionAuthItem {
        @JsonProperty("function")
        private String function;
    }
}
