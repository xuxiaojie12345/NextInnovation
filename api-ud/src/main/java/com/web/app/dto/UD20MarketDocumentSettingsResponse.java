package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * UD20 市场文档设置响应对象
 *
 * 功能说明：返回文档列表查询结果
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD20市场文档设置响应对象", description = "包含文档列表查询结果")
public class UD20MarketDocumentSettingsResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "响应码", example = "200")
    private Integer code;

    @ApiModelProperty(value = "响应消息", example = "success")
    private String message;

    @ApiModelProperty(value = "响应数据")
    private List<DocumentData> data;

    // ==================== 静态工厂方法 ====================

    public static UD20MarketDocumentSettingsResponse success(String msg, List<DocumentData> data) {
        UD20MarketDocumentSettingsResponse response = new UD20MarketDocumentSettingsResponse();
        response.setCode(200);
        response.setMessage(msg);
        response.setData(data);
        return response;
    }

    public static UD20MarketDocumentSettingsResponse error(Integer code, String msg) {
        UD20MarketDocumentSettingsResponse response = new UD20MarketDocumentSettingsResponse();
        response.setCode(code);
        response.setMessage(msg);
        response.setData(null);
        return response;
    }

    // ==================== 内部数据类 ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "文档数据", description = "文档信息")
    public static class DocumentData implements Serializable {
        private static final long serialVersionUID = 1L;
        @ApiModelProperty(value = "ID", example = "1")
        private Integer id;
        @ApiModelProperty(value = "文档类型", example = "Homologation Certificate")
        private String documentType;
        @ApiModelProperty(value = "业务单元", example = "BU")
        private String businessUnit;
        @ApiModelProperty(value = "注册用户", example = "john.doe")
        private String registerUser;
        @ApiModelProperty(value = "注册时间", example = "2026-05-15 10:30:00")
        private String registerDateTime;
    }
}
