package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD10 HDOC变量管理请求对象
 *
 * 功能说明：接收前端传入的HDOC变量增删改请求参数
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD10 HDOC变量管理请求对象", description = "包含HDOC变量的增删改请求参数")
public class UD10HdocvariablesRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "变量名", required = true, example = "VAR001")
    private String variable;

    @ApiModelProperty(value = "类型", example = "STRING")
    private String type;

    @ApiModelProperty(value = "描述", example = "变量描述信息")
    private String description;

    @ApiModelProperty(value = "创建用户", example = "admin")
    private String createdByUser;

    @ApiModelProperty(value = "日期", example = "2026-06-24 10:00:00")
    private String date;
}
