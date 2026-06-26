package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * UD14 搜索结果列表响应对象
 *
 * 功能说明：返回市场列表及变量搜索结果
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD14搜索结果列表响应对象", description = "包含市场列表及变量搜索结果")
public class UD14SearchresultistResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "响应码", example = "200")
    private Integer code;

    @ApiModelProperty(value = "响应消息", example = "查询成功")
    private String msg;

    @ApiModelProperty(value = "响应数据")
    private Object data;

    @ApiModelProperty(value = "消息列表")
    private List<MessageItem> messageList;

    // ==================== 静态工厂方法 ====================

    public static UD14SearchresultistResponse success(String msg, Object data) {
        UD14SearchresultistResponse response = new UD14SearchresultistResponse();
        response.setCode(200);
        response.setMsg(msg);
        response.setData(data);
        return response;
    }

    public static UD14SearchresultistResponse successWithMessages(String msg, Object data,
            List<MessageItem> messageList) {
        UD14SearchresultistResponse response = new UD14SearchresultistResponse();
        response.setCode(200);
        response.setMsg(msg);
        response.setData(data);
        response.setMessageList(messageList);
        return response;
    }

    public static UD14SearchresultistResponse error(Integer code, String msg) {
        UD14SearchresultistResponse response = new UD14SearchresultistResponse();
        response.setCode(code);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }

    // ==================== 内部数据类 ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "消息项", description = "消息列表项")
    public static class MessageItem implements Serializable {
        private static final long serialVersionUID = 1L;
        @ApiModelProperty(value = "消息编码", example = "")
        private String code;
        @ApiModelProperty(value = "消息内容", example = "")
        private String message;
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
    @ApiModel(value = "变量数据", description = "变量信息")
    public static class VariableData implements Serializable {
        private static final long serialVersionUID = 1L;
        @ApiModelProperty(value = "变量名", example = "VAR001")
        private String variable;
    }
}
