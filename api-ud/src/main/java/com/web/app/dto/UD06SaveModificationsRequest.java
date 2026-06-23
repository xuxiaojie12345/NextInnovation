package com.web.app.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import java.io.Serializable;

/**
 * UD06 保存修改内容请求对象
 *
 * 功能说明：接收前端传入的底盘系列和底盘编号参数
 *
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-22
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD06保存修改内容请求对象", description = "包含底盘系列和底盘编号")
public class UD06SaveModificationsRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "底盘系列", required = true, example = "JPCT", notes = "必填，最大5字符，半角英数字")
    private String chassisSerie;

    @ApiModelProperty(value = "底盘编号", required = true, example = "028321", notes = "必填，最大10字符，半角数字")
    private String chassisNo;
}
