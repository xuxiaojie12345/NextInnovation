package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD16 AD/CA变更请求对象
 *
 * 功能说明：接收前端传入的AD/CA变更管理请求参数
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD16 AD/CA变更请求对象", description = "包含AD/CA变更管理的请求参数")
public class UD16ADChangeRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "系列", required = true, example = "ABC12")
    private String serie;

    @ApiModelProperty(value = "底盘号", required = true, example = "1234567890")
    private String chnr;

    @ApiModelProperty(value = "变更理由", example = "设计变更")
    private String desc;

    @ApiModelProperty(value = "登录用户ID", example = "admin")
    private String userId;
}
