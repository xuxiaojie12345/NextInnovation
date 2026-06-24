package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
// import java.util.Collections;
import java.util.List;

/**
 * UD06 保存修改内容响应对象
 *
 * 功能说明：返回保存修改内容查询结果，包括 DOCTYPE、VERS、VARIABLE、NEWVAL
 *
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-22
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD06保存修改内容响应对象", description = "包含保存修改内容的查询结果数据")
public class UD06SaveModificationsResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "响应码", example = "200")
    private Integer code;

    @ApiModelProperty(value = "响应消息", example = "查询成功")
    private String msg;

    @ApiModelProperty(value = "响应数据")
    private DataObject data;

    @ApiModelProperty(value = "消息列表")
    private List<MessageItem> messageList;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "UD06保存修改内容数据", description = "保存修改内容的详细数据")
    public static class DataObject implements Serializable {

        @ApiModelProperty(value = "文档类型", example = "DIM-PLATE")
        private String doctype;

        @ApiModelProperty(value = "版本", example = "1")
        private String vers;

        @ApiModelProperty(value = "变量", example = "SEAT_NO_4")
        private String variable;

        @ApiModelProperty(value = "新值", example = "SEAT_NO_4")
        private String newVal;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageItem implements Serializable {

        @ApiModelProperty(value = "错误码", example = "E001")
        private String code;

        @ApiModelProperty(value = "错误消息", example = "We can not get the data. Please try again.")
        private String message;
    }

    public static UD06SaveModificationsResponse success(DataObject data) {
        UD06SaveModificationsResponse response = new UD06SaveModificationsResponse();
        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        return response;
    }

    public static UD06SaveModificationsResponse successNoData(String msg) {
        UD06SaveModificationsResponse response = new UD06SaveModificationsResponse();
        response.setCode(200);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }

    public static UD06SaveModificationsResponse error(Integer code, String msg) {
        UD06SaveModificationsResponse response = new UD06SaveModificationsResponse();
        response.setCode(code);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }

    public static UD06SaveModificationsResponse errorWithMessages(Integer code, String msg,
            List<MessageItem> messageList) {
        UD06SaveModificationsResponse response = new UD06SaveModificationsResponse();
        response.setCode(code);
        response.setMsg(msg);
        response.setData(null);
        response.setMessageList(messageList);
        return response;
    }
}
