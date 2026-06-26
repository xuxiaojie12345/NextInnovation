package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD15 VIN Plate数据请求对象
 *
 * 功能说明：接收前端传入的VIN Plate信息查询、状态更新请求参数
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD15 VIN Plate数据请求对象", description = "包含VIN Plate信息查询、状态更新的请求参数")
public class UD15SelecthdocsenddatavinplateRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "底盘系列", required = true, example = "ABC12")
    private String chassisSerie;

    @ApiModelProperty(value = "底盘编号", required = true, example = "1234567890")
    private String chassisNo;
}
