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
 * UD07 车辆规格响应对象
 *
 * 功能说明：返回车辆规格查询结果，包括车辆主数据和KOLA变体列表
 *
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-22
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD07车辆规格响应对象", description = "包含车辆规格及KOLA变体信息")
public class UD07VehicleSpecificationResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "响应码", example = "200")
    private Integer code;

    @ApiModelProperty(value = "响应消息", example = "查询成功")
    private String msg;

    @ApiModelProperty(value = "响应数据")
    private VehicleSpecificationData data;

    @ApiModelProperty(value = "消息列表")
    private List<MessageItem> messageList;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "UD07车辆规格数据", description = "车辆规格结果数据")
    public static class VehicleSpecificationData implements Serializable {

        @ApiModelProperty(value = "车型", example = "ModelX")
        private String model;

        @ApiModelProperty(value = "客户适配", example = "EU-STD")
        private String customerAdap;

        @ApiModelProperty(value = "构建周", example = "20")
        private String buildWeek;

        @ApiModelProperty(value = "产品类型", example = "Truck")
        private String productType;

        @ApiModelProperty(value = "VIN", example = "VIN1234567890")
        private String vin;

        @ApiModelProperty(value = "运营国家", example = "JP")
        private String countryOfOperation;

        @ApiModelProperty(value = "Family ID", example = "FAM001")
        private String familyId;

        @ApiModelProperty(value = "Variant ID", example = "VAR001")
        private String variantId;

        @ApiModelProperty(value = "KOLA变体列表")
        private List<KolaVariantData> kolaVariants;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "KOLA变体数据", description = "KOLA变体详细信息")
    public static class KolaVariantData implements Serializable {

        @ApiModelProperty(value = "符号", example = "ABCDEFGH")
        private String symbol;

        @ApiModelProperty(value = "功能组", example = "FUNC123")
        private String functionGroup;

        @ApiModelProperty(value = "描述", example = "Description text")
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageItem implements Serializable {

        @ApiModelProperty(value = "错误码", example = "E001")
        private String code;

        @ApiModelProperty(value = "错误消息", example = "参数验证失败")
        private String message;
    }

    public static UD07VehicleSpecificationResponse success(VehicleSpecificationData data) {
        UD07VehicleSpecificationResponse response = new UD07VehicleSpecificationResponse();
        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        return response;
    }

    public static UD07VehicleSpecificationResponse error(Integer code, String msg) {
        UD07VehicleSpecificationResponse response = new UD07VehicleSpecificationResponse();
        response.setCode(code);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }

    public static UD07VehicleSpecificationResponse errorWithMessages(Integer code, String msg,
            List<MessageItem> messageList) {
        UD07VehicleSpecificationResponse response = new UD07VehicleSpecificationResponse();
        response.setCode(code);
        response.setMsg(msg);
        response.setData(null);
        response.setMessageList(messageList);
        return response;
    }
}
