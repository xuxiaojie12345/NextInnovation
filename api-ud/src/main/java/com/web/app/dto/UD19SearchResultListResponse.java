package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * UD19 用户搜索结果列表响应对象
 *
 * 功能说明：返回市场列表及用户搜索结果
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD19用户搜索结果列表响应对象", description = "包含市场列表及用户搜索结果")
public class UD19SearchResultListResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "响应码", example = "200")
    private Integer code;

    @ApiModelProperty(value = "响应消息", example = "查询成功")
    private String msg;

    @ApiModelProperty(value = "响应数据")
    private Object data;

    // ==================== 静态工厂方法 ====================

    public static UD19SearchResultListResponse success(String msg, Object data) {
        UD19SearchResultListResponse response = new UD19SearchResultListResponse();
        response.setCode(200);
        response.setMsg(msg);
        response.setData(data);
        return response;
    }

    public static UD19SearchResultListResponse error(Integer code, String msg) {
        UD19SearchResultListResponse response = new UD19SearchResultListResponse();
        response.setCode(code);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }

    // ==================== 内部数据类 ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "市场数据", description = "市场列表")
    public static class MarketData implements Serializable {
        private static final long serialVersionUID = 1L;
        @ApiModelProperty(value = "市场代码", example = "JP")
        private String market;
        @ApiModelProperty(value = "描述", example = "Japan")
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "用户搜索结果数据", description = "用户搜索结果")
    public static class SearchResultData implements Serializable {
        private static final long serialVersionUID = 1L;
        @ApiModelProperty(value = "总记录数", example = "5")
        private Integer count;
        @ApiModelProperty(value = "数据表格")
        private List<UserData> datatable;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "用户数据", description = "用户信息")
    public static class UserData implements Serializable {
        private static final long serialVersionUID = 1L;
        @ApiModelProperty(value = "用户ID", example = "user123")
        private String userId;
        @ApiModelProperty(value = "用户名", example = "John")
        private String username;
        @ApiModelProperty(value = "市场", example = "JP")
        private String market;
    }
}
