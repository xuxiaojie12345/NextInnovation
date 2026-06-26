package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD19 用户搜索结果列表请求对象
 *
 * 功能说明：接收前端传入的用户搜索查询请求参数
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD19用户搜索结果列表请求对象", description = "包含用户搜索查询的请求参数")
public class UD19SearchResultListRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "用户ID", example = "user123")
    private String userId;

    @ApiModelProperty(value = "用户名", example = "John")
    private String username;

    @ApiModelProperty(value = "市场", example = "JP")
    private String market;

    @ApiModelProperty(value = "类型", example = "Standard User")
    private String type;
}
