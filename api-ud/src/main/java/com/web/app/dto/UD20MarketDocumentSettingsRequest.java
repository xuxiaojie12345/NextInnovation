package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD20-1 市场文档设置更新请求对象
 *
 * 功能说明：接收前端传入的文档设置更新请求参数
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-07-01
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD20市场文档设置更新请求对象", description = "包含文档设置更新的请求参数")
public class UD20MarketDocumentSettingsRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "文档类型", required = true, example = "Homologation Certificate", notes = "必填，用于定位要更新的记录")
    private String doctype;

    @ApiModelProperty(value = "注册用户", example = "john.doe")
    private String user;

    @ApiModelProperty(value = "注册日期时间", example = "2026-05-15 10:30:00")
    private String date;
}
