package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD18 用户文档权限管理响应对象
 *
 * 功能说明：返回用户文档权限检查、查询、更新、删除操作结果
 * 对应全体API設計：UD18HDocUserDocAdministrationApi
 *
 * @author GitHub Copilot
 * @version 2.0
 * @date 2026-06-30
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD18用户文档权限管理响应对象", description = "包含用户文档权限管理操作结果")
public class UD18HDocUserDocAdministrationResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "响应码", example = "200")
    private Integer code;

    @ApiModelProperty(value = "响应消息", example = "查询成功")
    private String msg;

    @ApiModelProperty(value = "响应数据")
    private Object data;

    // ==================== 静态工厂方法 ====================

    public static UD18HDocUserDocAdministrationResponse success(String msg, Object data) {
        UD18HDocUserDocAdministrationResponse response = new UD18HDocUserDocAdministrationResponse();
        response.setCode(200);
        response.setMsg(msg);
        response.setData(data);
        return response;
    }

    public static UD18HDocUserDocAdministrationResponse error(Integer code, String msg) {
        UD18HDocUserDocAdministrationResponse response = new UD18HDocUserDocAdministrationResponse();
        response.setCode(code);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }
}
