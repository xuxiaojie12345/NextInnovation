package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD14 搜索结果列表请求对象
 *
 * 功能说明：接收前端传入的市场选择、变量搜索请求参数
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD14搜索结果列表请求对象", description = "包含搜索结果列表查询的请求参数")
public class UD14SearchresultistRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "市场", example = "JP")
    private String market;
}
