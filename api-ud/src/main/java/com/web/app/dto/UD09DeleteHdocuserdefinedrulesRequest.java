package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD09 删除用户定义规则请求对象
 *
 * 功能说明：接收前端传入的搜索和删除规则请求参数
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD09删除用户定义规则请求对象", description = "包含搜索和删除规则的请求参数")
public class UD09DeleteHdocuserdefinedrulesRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "产品类别(PC)", example = "A1")
    private String productClass;

    @ApiModelProperty(value = "序号", example = "1")
    private Integer number;

    @ApiModelProperty(value = "市场", example = "JP")
    private String market;

    @ApiModelProperty(value = "变量", example = "VAR001")
    private String variable;

    @ApiModelProperty(value = "值", example = "VALUE001")
    private String value;

    @ApiModelProperty(value = "变体字符串1", example = "VS001")
    private String variantString1;

    @ApiModelProperty(value = "变体字符串2", example = "VS002")
    private String variantString2;

    @ApiModelProperty(value = "备注", example = "备注信息")
    private String comments;
}
