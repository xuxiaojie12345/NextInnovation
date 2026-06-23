package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.util.Collections;
import java.util.List;

/**
 * UD05 修改文档变量响应对象
 *
 * 功能说明：返回查询或更新结果，包括文档变量详情
 *
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-18
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD05修改文档变量响应对象", description = "包含查询结果或更新结果的标准响应格式")
public class UD05ModifyDocumentResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "响应码", example = "200")
    private Integer code;

    @ApiModelProperty(value = "响应消息", example = "查询成功")
    private String msg;

    @ApiModelProperty(value = "响应数据")
    private List<ModifyDocumentData> data;

    @ApiModelProperty(value = "消息列表")
    private List<MessageItem> messageList;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "修改文档变量数据", description = "UD05查询返回的文档变量信息")
    public static class ModifyDocumentData {

        @ApiModelProperty(value = "底盘系列", example = "ABC12")
        private String chassisSerie;

        @ApiModelProperty(value = "底盘编号", example = "1234567890")
        private String chassisNo;

        @ApiModelProperty(value = "变量编码", example = "VAR001")
        private String variable;

        @ApiModelProperty(value = "变量描述", example = "Engine Type")
        private String description;

        @ApiModelProperty(value = "原值", example = "OldValue")
        private String oldVal;

        @ApiModelProperty(value = "新值", example = "NewValue")
        private String newVal;

        @ApiModelProperty(value = "状态", example = "0")
        private String sta;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageItem {

        @ApiModelProperty(value = "错误码", example = "E001")
        private String code;

        @ApiModelProperty(value = "错误消息", example = "参数验证失败")
        private String message;
    }

    public static UD05ModifyDocumentResponse success(List<ModifyDocumentData> data) {
        UD05ModifyDocumentResponse response = new UD05ModifyDocumentResponse();
        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        return response;
    }

    public static UD05ModifyDocumentResponse success(ModifyDocumentData data) {
        UD05ModifyDocumentResponse response = new UD05ModifyDocumentResponse();
        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data == null ? null : Collections.singletonList(data));
        return response;
    }

    public static UD05ModifyDocumentResponse successNoData(String msg) {
        UD05ModifyDocumentResponse response = new UD05ModifyDocumentResponse();
        response.setCode(200);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }

    public static UD05ModifyDocumentResponse error(Integer code, String msg) {
        UD05ModifyDocumentResponse response = new UD05ModifyDocumentResponse();
        response.setCode(code);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }

    public static UD05ModifyDocumentResponse errorWithMessages(Integer code, String msg, List<MessageItem> messageList) {
        UD05ModifyDocumentResponse response = new UD05ModifyDocumentResponse();
        response.setCode(code);
        response.setMsg(msg);
        response.setData(null);
        response.setMessageList(messageList);
        return response;
    }
}
