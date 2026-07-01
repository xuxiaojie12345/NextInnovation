package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD20-1 市场文档设置更新响应对象
 *
 * 功能说明：返回文档设置更新结果
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-07-01
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD20市场文档设置更新响应对象", description = "包含文档设置更新结果")
public class UD20MarketDocumentSettingsResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "响应码", example = "200")
    private Integer code;

    @ApiModelProperty(value = "响应消息", example = "保存成功")
    private String msg;

    @ApiModelProperty(value = "响应数据")
    private Object data;

    // ==================== 静态工厂方法 ====================

    public static UD20MarketDocumentSettingsResponse success(String msg) {
        UD20MarketDocumentSettingsResponse response = new UD20MarketDocumentSettingsResponse();
        response.setCode(200);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }

    public static UD20MarketDocumentSettingsResponse error(Integer code, String msg) {
        UD20MarketDocumentSettingsResponse response = new UD20MarketDocumentSettingsResponse();
        response.setCode(code);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }
}
