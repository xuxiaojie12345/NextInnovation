package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD08 认证变量规则请求对象
 *
 * 功能说明：接收前端传入的认证变量规则相关请求参数
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD08认证变量规则请求对象", description = "包含认证变量规则的各种请求参数")
public class UD08HomologationVariablesRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "变量名", example = "VAR001")
    private String variables;

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

    @ApiModelProperty(value = "添加日期", example = "202606")
    private String addDate;

    @ApiModelProperty(value = "删除日期", example = "")
    private String deleteDate;

    @ApiModelProperty(value = "创建用户", example = "admin")
    private String createdByUser;

    @ApiModelProperty(value = "日期", example = "2026-06-24 10:00:00")
    private String date;
}
