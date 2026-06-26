package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD16 AD/CA变更响应对象
 *
 * 功能说明：返回AD/CA变更操作结果
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD16 AD/CA变更响应对象", description = "包含AD/CA变更操作结果")
public class UD16ADChangeResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "响应码", example = "200")
    private Integer code;

    @ApiModelProperty(value = "响应消息", example = "添加成功")
    private String msg;

    @ApiModelProperty(value = "响应数据")
    private Object data;

    // ==================== 静态工厂方法 ====================

    public static UD16ADChangeResponse success(String msg, Object data) {
        UD16ADChangeResponse response = new UD16ADChangeResponse();
        response.setCode(200);
        response.setMsg(msg);
        response.setData(data);
        return response;
    }

    public static UD16ADChangeResponse error(Integer code, String msg) {
        UD16ADChangeResponse response = new UD16ADChangeResponse();
        response.setCode(code);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }
}
