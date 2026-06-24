package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD08 认证变量规则响应对象
 *
 * 功能说明：返回认证变量规则查询及操作结果
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD08认证变量规则响应对象", description = "包含认证变量规则的操作结果数据")
public class UD08HomologationVariablesResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "响应码", example = "200")
    private Integer code;

    @ApiModelProperty(value = "响应消息", example = "查询成功")
    private String message;

    @ApiModelProperty(value = "响应数据")
    private Object data;

    // ==================== 静态工厂方法 ====================

    public static UD08HomologationVariablesResponse success(String msg, Object data) {
        UD08HomologationVariablesResponse response = new UD08HomologationVariablesResponse();
        response.setCode(200);
        response.setMessage(msg);
        response.setData(data);
        return response;
    }

    public static UD08HomologationVariablesResponse error(Integer code, String msg) {
        UD08HomologationVariablesResponse response = new UD08HomologationVariablesResponse();
        response.setCode(code);
        response.setMessage(msg);
        response.setData(null);
        return response;
    }

    // ==================== 内部数据类 ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "产品类别数据", description = "产品类别PC列表")
    public static class ProductClassData implements Serializable {
        private static final long serialVersionUID = 1L;
        @ApiModelProperty(value = "产品类别代码", example = "A1")
        private String pc;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "市场数据", description = "市场列表")
    public static class MarketData implements Serializable {
        private static final long serialVersionUID = 1L;
        @ApiModelProperty(value = "市场代码", example = "JP")
        private String market;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "HDOC变量存在检查数据", description = "HDOC变量是否存在")
    public static class HdocVariablesExistsData implements Serializable {
        private static final long serialVersionUID = 1L;
        @ApiModelProperty(value = "是否存在", example = "true")
        private Boolean exists;
    }
}
