package com.web.app.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * UD17 用户权限管理请求对象
 *
 * 功能说明：接收前端传入的用户权限查询、更新、删除请求参数
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD17用户权限管理请求对象", description = "包含用户权限管理的请求参数")
public class UD17HDocUserAdministrationRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "用户ID", required = true, example = "user123")
    @JsonProperty("userId")
    private String userid;

    @ApiModelProperty(value = "功能权限列表（含对应市场信息）")
    private List<FunctionAuthItem> functionAuths;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "功能权限项", description = "功能权限及对应市场权限信息")
    public static class FunctionAuthItem implements Serializable {
        private static final long serialVersionUID = 1L;
        @ApiModelProperty(value = "功能权限", example = "Standard User")
        private String function;
        @ApiModelProperty(value = "市场", example = "-EU")
        private String market;
    }
}
