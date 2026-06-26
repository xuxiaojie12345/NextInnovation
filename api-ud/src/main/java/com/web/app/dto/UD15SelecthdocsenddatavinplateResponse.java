package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * UD15 VIN Plate数据响应对象
 *
 * 功能说明：返回VIN Plate信息查询及状态操作结果
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD15 VIN Plate数据响应对象", description = "包含VIN Plate信息查询及状态操作结果")
public class UD15SelecthdocsenddatavinplateResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "响应码", example = "200")
    private Integer code;

    @ApiModelProperty(value = "响应消息", example = "查询成功")
    private String msg;

    @ApiModelProperty(value = "响应数据")
    private Object data;

    // ==================== 静态工厂方法 ====================

    public static UD15SelecthdocsenddatavinplateResponse success(String msg, Object data) {
        UD15SelecthdocsenddatavinplateResponse response = new UD15SelecthdocsenddatavinplateResponse();
        response.setCode(200);
        response.setMsg(msg);
        response.setData(data);
        return response;
    }

    public static UD15SelecthdocsenddatavinplateResponse error(Integer code, String msg) {
        UD15SelecthdocsenddatavinplateResponse response = new UD15SelecthdocsenddatavinplateResponse();
        response.setCode(code);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }

    // ==================== 内部数据类 ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "VIN Plate信息数据", description = "VIN Plate详细信息")
    public static class VinPlateInfoData implements Serializable {
        private static final long serialVersionUID = 1L;
        @ApiModelProperty(value = "底盘号", example = "ABC123456789")
        private String chassisNumber;
        @ApiModelProperty(value = "板类型", example = "1")
        private String plateType;
        @ApiModelProperty(value = "状态", example = "0")
        private String status;
        @ApiModelProperty(value = "错误消息", example = "")
        private String errorMessage;
        @ApiModelProperty(value = "注册时间", example = "2026-05-20 10:30:00")
        private LocalDateTime registerDatetime;
        @ApiModelProperty(value = "文档就绪", example = "Y")
        private String docReady;
        @ApiModelProperty(value = "文档发送", example = "N")
        private String docSent;
        @ApiModelProperty(value = "打印项列表")
        private List<String> printItems;
        @ApiModelProperty(value = "VP数据列表")
        private List<VpDataItem> vpData;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "VP数据项", description = "VP数据项")
    public static class VpDataItem implements Serializable {
        private static final long serialVersionUID = 1L;
        @ApiModelProperty(value = "变体名", example = "VAR1")
        private String variantName;
        @ApiModelProperty(value = "值", example = "Value1")
        private String value;
    }
}
