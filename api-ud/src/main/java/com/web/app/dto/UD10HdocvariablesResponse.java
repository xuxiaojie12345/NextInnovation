package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD10 HDOC变量管理响应对象
 *
 * 功能说明：返回HDOC变量增删改操作结果
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD10 HDOC变量管理响应对象", description = "包含HDOC变量增删改操作结果")
public class UD10HdocvariablesResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "响应码", example = "200")
    private Integer code;

    @ApiModelProperty(value = "响应消息", example = "")
    private String message;

    @ApiModelProperty(value = "响应数据")
    private Object data;

    // ==================== 静态工厂方法 ====================

    public static UD10HdocvariablesResponse success(String msg) {
        UD10HdocvariablesResponse response = new UD10HdocvariablesResponse();
        response.setCode(200);
        response.setMessage(msg);
        response.setData(null);
        return response;
    }

    public static UD10HdocvariablesResponse error(Integer code, String msg) {
        UD10HdocvariablesResponse response = new UD10HdocvariablesResponse();
        response.setCode(code);
        response.setMessage(msg);
        response.setData(null);
        return response;
    }
}
