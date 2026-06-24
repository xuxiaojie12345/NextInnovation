package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD11 HDOC变量搜索请求对象
 *
 * 功能说明：接收前端传入的HDOC变量搜索查询请求参数
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD11 HDOC变量搜索请求对象", description = "包含HDOC变量搜索查询的参数")
public class UD11HdocvariablesRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "变量名", example = "VAR001")
    private String variable;

    @ApiModelProperty(value = "类型", example = "STRING")
    private String type;

    @ApiModelProperty(value = "描述", example = "变量描述信息")
    private String description;

    @ApiModelProperty(value = "创建用户", example = "admin")
    private String createdByUser;

    @ApiModelProperty(value = "日期", example = "2026-06-24")
    private String date;
}
