package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD09 删除用户定义规则响应对象
 *
 * 功能说明：返回搜索和删除规则的操作结果
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD09删除用户定义规则响应对象", description = "包含搜索和删除规则的操作结果")
public class UD09DeleteHdocuserdefinedrulesResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "响应码", example = "200")
    private Integer code;

    @ApiModelProperty(value = "响应消息", example = "")
    private String message;

    @ApiModelProperty(value = "响应数据")
    private Object data;

    // ==================== 静态工厂方法 ====================

    public static UD09DeleteHdocuserdefinedrulesResponse success(String msg, Object data) {
        UD09DeleteHdocuserdefinedrulesResponse response = new UD09DeleteHdocuserdefinedrulesResponse();
        response.setCode(200);
        response.setMessage(msg);
        response.setData(data);
        return response;
    }

    public static UD09DeleteHdocuserdefinedrulesResponse error(Integer code, String msg) {
        UD09DeleteHdocuserdefinedrulesResponse response = new UD09DeleteHdocuserdefinedrulesResponse();
        response.setCode(code);
        response.setMessage(msg);
        response.setData(null);
        return response;
    }

    // ==================== 内部数据类 ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "用户定义规则数据", description = "用户定义规则详细信息")
    public static class UserDefinedRuleData implements Serializable {
        private static final long serialVersionUID = 1L;
        @ApiModelProperty(value = "产品类别", example = "A1")
        private String productClass;
        @ApiModelProperty(value = "序号", example = "1")
        private Long number;
        @ApiModelProperty(value = "市场", example = "JP")
        private String market;
        @ApiModelProperty(value = "变量", example = "VAR001")
        private String variable;
        @ApiModelProperty(value = "值", example = "VALUE001")
        private String value;
        @ApiModelProperty(value = "变体字符串1", example = "VS001")
        private String variantString1;
        @ApiModelProperty(value = "变体字符串2", example = "VS002")
        private String variantString2;
        @ApiModelProperty(value = "备注", example = "备注信息")
        private String comments;
        @ApiModelProperty(value = "添加日期", example = "202606")
        private String addDate;
        @ApiModelProperty(value = "删除日期", example = "")
        private String deleteDate;
        @ApiModelProperty(value = "创建用户", example = "admin")
        private String createdByUser;
        @ApiModelProperty(value = "注册时间", example = "2026-06-24 10:00:00")
        private String date;
    }
}
