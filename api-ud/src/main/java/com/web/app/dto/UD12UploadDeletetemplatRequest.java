package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD12 上传删除模板请求对象
 *
 * 功能说明：接收前端传入的模板上传、删除请求参数
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD12上传删除模板请求对象", description = "包含模板上传、删除的请求参数")
public class UD12UploadDeletetemplatRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "市场", example = "JP")
    private String market;

    @ApiModelProperty(value = "模板文件名", example = "template.rtf")
    private String template;
}
