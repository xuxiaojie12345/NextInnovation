package com.web.app.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import java.io.Serializable;

/**
 * UD07 车辆规格查询请求对象
 *
 * 功能说明：接收前端传入的serie和chno参数
 *
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-22
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD07车辆规格查询请求对象", description = "包含底盘系列和底盘编号")
public class UD07VehicleSpecificationRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "底盘系列", required = true, example = "ABC12", notes = "必填，最大5字符，半角英数字")
    private String serie;

    @ApiModelProperty(value = "底盘编号", required = true, example = "1234567890", notes = "必填，最大10字符，半角数字")
    private String chno;
}
