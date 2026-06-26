package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * UD18 用户文档权限管理响应对象
 *
 * 功能说明：返回用户文档权限查询、更新操作结果
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD18用户文档权限管理响应对象", description = "包含用户文档权限管理操作结果")
public class UD18HDocUserDocAdministrationResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "响应码", example = "200")
    private Integer code;

    @ApiModelProperty(value = "响应消息", example = "查询成功")
    private String msg;

    @ApiModelProperty(value = "响应数据")
    private Object data;

    // ==================== 静态工厂方法 ====================

    public static UD18HDocUserDocAdministrationResponse success(String msg, Object data) {
        UD18HDocUserDocAdministrationResponse response = new UD18HDocUserDocAdministrationResponse();
        response.setCode(200);
        response.setMsg(msg);
        response.setData(data);
        return response;
    }

    public static UD18HDocUserDocAdministrationResponse error(Integer code, String msg) {
        UD18HDocUserDocAdministrationResponse response = new UD18HDocUserDocAdministrationResponse();
        response.setCode(code);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }

    // ==================== 内部数据类 ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "用户信息数据", description = "用户基本信息")
    public static class UserInfoData implements Serializable {
        private static final long serialVersionUID = 1L;
        @ApiModelProperty(value = "用户ID", example = "user123")
        private String userid;
        @ApiModelProperty(value = "用户名", example = "John Doe")
        private String name;
        @ApiModelProperty(value = "负责人", example = "Manager")
        private String responsible;
        @ApiModelProperty(value = "用户职位", example = "Engineer")
        private String userPosition;
        @ApiModelProperty(value = "邮箱", example = "john@example.com")
        private String email;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "用户文档数据", description = "用户文档类型信息")
    public static class UserDocData implements Serializable {
        private static final long serialVersionUID = 1L;
        @ApiModelProperty(value = "文档类型", example = "Homologation Certificate")
        private String doctype;
    }
}
