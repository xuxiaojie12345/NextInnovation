package com.web.app.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import java.io.Serializable;

/**
 * UD04 获取生成文档数据请求对象
 * 
 * 功能说明：接收前端传入的底盘系列和底盘编号参数
 * 
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-18
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD04获取生成文档数据请求对象", description = "包含底盘系列和底盘编号")
public class UD04SelectGeneratedocumentRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 底盘系列 (Chassis Serie)
     * 必填，最大长度5字符，仅允许半角英数字
     */
    @ApiModelProperty(value = "底盘系列", required = true, example = "ABC12", notes = "必填，最大5字符，半角英数字")
    private String chassisSerie;

    /**
     * 底盘编号 (Chassis No)
     * 必填，最大长度10字符，仅允许半角数字
     */
    @ApiModelProperty(value = "底盘编号", required = true, example = "1234567890", notes = "必填，最大10字符，半角数字")
    private String chassisNo;
}
