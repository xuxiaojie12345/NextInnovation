package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD20 获取文档列表请求对象
 *
 * 功能说明：接收前端传入的文档列表查询请求参数
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-07-01
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD20获取文档列表请求对象", description = "包含文档列表查询的请求参数")
public class UD20GetDocumentListRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "文档类型（支持模糊查询）", example = "Homologation")
    private String doctype;

    @ApiModelProperty(value = "文档类型运算符(= / ≠)", example = "=")
    private String doctypeOp;

    @ApiModelProperty(value = "注册用户", example = "john.doe")
    private String registerUser;

    @ApiModelProperty(value = "注册用户运算符(= / ≠)", example = "=")
    private String registerUserOp;

    @ApiModelProperty(value = "注册日期", example = "2026-01-01")
    private String registerDatetime;

    @ApiModelProperty(value = "注册日期运算符(= / < / >)", example = "=")
    private String registerDatetimeOp;
}
