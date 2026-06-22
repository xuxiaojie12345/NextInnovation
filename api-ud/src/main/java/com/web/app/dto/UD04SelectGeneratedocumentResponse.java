package com.web.app.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import java.io.Serializable;

/**
 * UD04 获取生成文档数据响应对象
 * 
 * 功能说明：返回生成文档所需的数据，包括订单号、构建周、规格周等信息
 * 
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-18
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD04获取生成文档数据响应对象", description = "包含生成文档的详细信息")
public class UD04SelectGeneratedocumentResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 响应码
     * 200: 成功
     * 400: 参数错误
     * 404: 数据不存在
     * 500: 服务器错误
     */
    @ApiModelProperty(value = "响应码", example = "200")
    private Integer code;

    /**
     * 响应消息
     */
    @ApiModelProperty(value = "响应消息", example = "查询成功")
    private String msg;

    /**
     * 响应数据 - 生成文档数据
     */
    @ApiModelProperty(value = "响应数据")
    private DocumentData data;

    /**
     * 消息列表（用于详细错误信息）
     */
    @ApiModelProperty(value = "消息列表")
    private java.util.List<MessageItem> messageList;

    /**
     * 文档数据内部类
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "文档数据", description = "生成文档的详细信息")
    public static class DocumentData {
        /**
         * 订单号 (Order Number)
         */
        @ApiModelProperty(value = "订单号", example = "ORD123456")
        private String ordernumber;

        /**
         * 构建周 (Build Week)
         */
        @ApiModelProperty(value = "构建周", example = "12")
        private Integer build;

        /**
         * 规格周 (Spec Week)
         */
        @ApiModelProperty(value = "规格周", example = "45")
        private Integer spec;

        /**
         * 客户适配 (Customer Adaptation)
         */
        @ApiModelProperty(value = "客户适配", example = "EU-STD")
        private String customerAdap;

        /**
         * 运营国家 (Country of Operation)
         */
        @ApiModelProperty(value = "运营国家", example = "DE")
        private String countryOfOperation;

        /**
         * 负载指数 (Load Index)
         */
        @ApiModelProperty(value = "负载指数", example = "91V")
        private String loadIndex;

        /**
         * ACT标志 (Active Flag)
         * Y: 活跃, N: 非活跃
         */
        @ApiModelProperty(value = "ACT标志", example = "Y")
        private String act;

        /**
         * 变量 (Variable)
         */
        @ApiModelProperty(value = "变量", example = "VAR001")
        private String variable;
    }

    /**
     * 消息项内部类
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageItem {
        /**
         * 错误码
         */
        @ApiModelProperty(value = "错误码", example = "E001")
        private String code;

        /**
         * 错误消息
         */
        @ApiModelProperty(value = "错误消息", example = "参数验证失败")
        private String message;
    }

    /**
     * 创建成功响应
     * 
     * @param documentData 文档数据
     * @return 成功响应对象
     */
    public static UD04SelectGeneratedocumentResponse success(DocumentData documentData) {
        UD04SelectGeneratedocumentResponse response = new UD04SelectGeneratedocumentResponse();
        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(documentData);
        return response;
    }

    /**
     * 创建失败响应
     * 
     * @param code 错误码
     * @param msg 错误消息
     * @return 失败响应对象
     */
    public static UD04SelectGeneratedocumentResponse error(Integer code, String msg) {
        UD04SelectGeneratedocumentResponse response = new UD04SelectGeneratedocumentResponse();
        response.setCode(code);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }

    /**
     * 创建带消息列表的失败响应
     * 
     * @param code 错误码
     * @param msg 错误消息
     * @param messageList 消息列表
     * @return 失败响应对象
     */
    public static UD04SelectGeneratedocumentResponse errorWithMessages(Integer code, String msg, java.util.List<MessageItem> messageList) {
        UD04SelectGeneratedocumentResponse response = new UD04SelectGeneratedocumentResponse();
        response.setCode(code);
        response.setMsg(msg);
        response.setData(null);
        response.setMessageList(messageList);
        return response;
    }
}
