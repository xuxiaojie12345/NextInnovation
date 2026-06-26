package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD20 市场文档设置请求对象
 *
 * 功能说明：接收前端传入的文档列表查询请求参数
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD20市场文档设置请求对象", description = "包含文档列表查询的请求参数")
public class UD20MarketDocumentSettingsRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "文档类型", example = "Homologation Certificate")
    private String doctype;

    @ApiModelProperty(value = "注册用户", example = "john.doe")
    private String registerUser;

    @ApiModelProperty(value = "注册时间", example = "2026-05-15 10:30:00")
    private String registerDatetime;
}
