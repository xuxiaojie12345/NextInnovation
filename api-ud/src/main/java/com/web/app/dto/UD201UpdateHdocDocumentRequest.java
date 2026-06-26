package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD20-1 更新文档列表请求对象
 *
 * 功能说明：接收前端传入的文档更新请求参数
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD20-1更新文档列表请求对象", description = "包含文档更新的请求参数")
public class UD201UpdateHdocDocumentRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "文档类型", required = true, example = "Homologation Certificate")
    private String doctype;

    @ApiModelProperty(value = "注册用户", example = "john.doe")
    private String registerUser;

    @ApiModelProperty(value = "注册时间", example = "2026-05-15 10:30:00")
    private String registerDatetime;
}
