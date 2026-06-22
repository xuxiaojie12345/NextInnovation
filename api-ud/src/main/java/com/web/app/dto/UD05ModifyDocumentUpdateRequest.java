package com.web.app.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import java.io.Serializable;

/**
 * UD05 修改文档变量更新请求对象
 *
 * 功能说明：用于接收变更请求参数
 *
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-18
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD05修改文档变量更新请求对象", description = "包含底盘系列、底盘编号、变量描述和新值")
public class UD05ModifyDocumentUpdateRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "底盘系列", required = true, example = "ABC12", notes = "必填，最大5字符，半角英数字")
    private String chassisSerie;

    @ApiModelProperty(value = "底盘编号", required = true, example = "1234567890", notes = "必填，最大10字符，半角数字")
    private String chassisNo;

    @ApiModelProperty(value = "当前值", required = true, example = "CurrentValue", notes = "必填，用于定位待更新记录")
    private String currentValue;

    @ApiModelProperty(value = "修改后的新值", required = true, example = "ModifiedValue", notes = "必填，要更新到 HDOC_ADCA_MODIFICATION.NEWVAL 字段")
    private String modifiedValue;
}
