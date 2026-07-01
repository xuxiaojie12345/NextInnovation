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

    @ApiModelProperty(value = "产品类别运算符(= / ≠)", example = "=")
    private String productClassOp;

    @ApiModelProperty(value = "序号", example = "1")
    private Integer number;

    @ApiModelProperty(value = "序号运算符(= / ≠)", example = "=")
    private String numberOp;

    @ApiModelProperty(value = "市场", example = "JP")
    private String market;

    @ApiModelProperty(value = "市场运算符(= / ≠)", example = "=")
    private String marketOp;

    @ApiModelProperty(value = "变量", example = "VAR001")
    private String variable;

    @ApiModelProperty(value = "变量运算符(= / ≠)", example = "=")
    private String variableOp;

    @ApiModelProperty(value = "值", example = "VALUE001")
    private String value;

    @ApiModelProperty(value = "值运算符(= / ≠)", example = "=")
    private String valueOp;

    @ApiModelProperty(value = "变体字符串1", example = "VS001")
    private String variantString1;

    @ApiModelProperty(value = "变体字符串1运算符(= / ≠)", example = "=")
    private String variantString1Op;

    @ApiModelProperty(value = "变体字符串2", example = "VS002")
    private String variantString2;

    @ApiModelProperty(value = "变体字符串2运算符(= / ≠)", example = "=")
    private String variantString2Op;

    @ApiModelProperty(value = "备注", example = "备注信息")
    private String comments;

    @ApiModelProperty(value = "备注运算符(= / ≠)", example = "=")
    private String commentsOp;

    @ApiModelProperty(value = "添加日期(ADD_DATE)", example = "202607")
    private String addDate;

    @ApiModelProperty(value = "添加日期运算符(= / < / >)", example = "=")
    private String addDateOp;

    @ApiModelProperty(value = "删除日期(DELETE_DATE)", example = "")
    private String deleteDate;

    @ApiModelProperty(value = "删除日期运算符(= / < / >)", example = "=")
    private String deleteDateOp;

    @ApiModelProperty(value = "创建用户(REGISTER_USER)", example = "admin")
    private String createdByUser;

    @ApiModelProperty(value = "创建用户运算符(= / ≠)", example = "=")
    private String createdByUserOp;

    @ApiModelProperty(value = "注册日期时间(REGISTER_DATETIME)", example = "2026-07-01T12:00:00")
    private String registerDatetime;

    @ApiModelProperty(value = "注册日期时间运算符(= / < / >)", example = "=")
    private String registerDatetimeOp;
}
