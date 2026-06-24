package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * UD11 HDOC变量搜索响应对象
 *
 * 功能说明：返回HDOC变量搜索查询结果
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD11 HDOC变量搜索响应对象", description = "包含HDOC变量搜索查询结果")
public class UD11HdocvariablesResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "响应码", example = "200")
    private Integer code;

    @ApiModelProperty(value = "响应消息", example = "查询成功")
    private String msg;

    @ApiModelProperty(value = "响应数据")
    private List<VariableData> data;

    // ==================== 静态工厂方法 ====================

    public static UD11HdocvariablesResponse success(String msg, List<VariableData> data) {
        UD11HdocvariablesResponse response = new UD11HdocvariablesResponse();
        response.setCode(200);
        response.setMsg(msg);
        response.setData(data);
        return response;
    }

    public static UD11HdocvariablesResponse error(Integer code, String msg) {
        UD11HdocvariablesResponse response = new UD11HdocvariablesResponse();
        response.setCode(code);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }

    // ==================== 内部数据类 ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "HDOC变量数据", description = "HDOC变量详细信息")
    public static class VariableData implements Serializable {
        private static final long serialVersionUID = 1L;
        @ApiModelProperty(value = "变量名", example = "VAR001")
        private String variable;
        @ApiModelProperty(value = "类型", example = "STRING")
        private String type;
        @ApiModelProperty(value = "描述", example = "变量描述信息")
        private String description;
        @ApiModelProperty(value = "注册用户", example = "admin")
        private String registerUser;
        @ApiModelProperty(value = "注册时间", example = "2024-01-01 00:00:00")
        private LocalDateTime registerDatetime;
    }
}
