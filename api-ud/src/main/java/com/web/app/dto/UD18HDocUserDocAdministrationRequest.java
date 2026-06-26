package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD18 用户文档权限管理请求对象
 *
 * 功能说明：接收前端传入的用户文档权限查询、更新请求参数
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD18用户文档权限管理请求对象", description = "包含用户文档权限管理的请求参数")
public class UD18HDocUserDocAdministrationRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "用户ID", required = true, example = "user123")
    private String userId;

    @ApiModelProperty(value = "文档类型", example = "Homologation Certificate")
    private String doctype;
}
