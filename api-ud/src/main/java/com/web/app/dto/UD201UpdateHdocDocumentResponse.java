package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD20-1 更新文档列表响应对象
 *
 * 功能说明：返回文档更新操作结果
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD20-1更新文档列表响应对象", description = "包含文档更新操作结果")
public class UD201UpdateHdocDocumentResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "响应码", example = "200")
    private Integer code;

    @ApiModelProperty(value = "响应消息", example = "保存成功")
    private String msg;

    @ApiModelProperty(value = "响应数据")
    private Object data;

    // ==================== 静态工厂方法 ====================

    public static UD201UpdateHdocDocumentResponse success(String msg, Object data) {
        UD201UpdateHdocDocumentResponse response = new UD201UpdateHdocDocumentResponse();
        response.setCode(200);
        response.setMsg(msg);
        response.setData(data);
        return response;
    }

    public static UD201UpdateHdocDocumentResponse error(Integer code, String msg) {
        UD201UpdateHdocDocumentResponse response = new UD201UpdateHdocDocumentResponse();
        response.setCode(code);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }
}
