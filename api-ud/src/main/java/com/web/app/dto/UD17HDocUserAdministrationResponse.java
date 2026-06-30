package com.web.app.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * UD17 用户权限管理响应对象
 *
 * 功能说明：返回用户权限查询、更新、删除操作结果
 * 对应设计书：UD17HDocUserAdministrationApi
 *
 * @author GitHub Copilot
 * @version 2.0
 * @date 2026-06-29
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD17用户权限管理响应对象", description = "包含用户权限管理操作结果")
public class UD17HDocUserAdministrationResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "响应码", example = "200")
    private String code;

    @ApiModelProperty(value = "是否成功", example = "true")
    private Boolean success;

    @ApiModelProperty(value = "响应消息", example = "查询成功")
    private String message;

    @ApiModelProperty(value = "用户ID", example = "user123")
    private String userId;

    @ApiModelProperty(value = "用户名称", example = "张三")
    private String userName;

    @ApiModelProperty(value = "权限列表（功能权限+市场权限）")
    private List<AuthItem> authList;

    // ==================== 静态工厂方法 ====================

    /**
     * 查询用户信息成功
     *
     * @param userId   用户ID
     * @param userName 用户名称
     * @param authList 权限列表
     * @return 响应对象
     */
    public static UD17HDocUserAdministrationResponse success(String userId, String userName, List<AuthItem> authList) {
        UD17HDocUserAdministrationResponse response = new UD17HDocUserAdministrationResponse();
        response.setCode("200");
        response.setSuccess(true);
        response.setMessage("查询成功");
        response.setUserId(userId);
        response.setUserName(userName);
        response.setAuthList(authList);
        return response;
    }

    /**
     * 更新/删除操作成功
     *
     * @param message 成功消息
     * @return 响应对象
     */
    public static UD17HDocUserAdministrationResponse updateSuccess(String message) {
        UD17HDocUserAdministrationResponse response = new UD17HDocUserAdministrationResponse();
        response.setCode("200");
        response.setSuccess(true);
        response.setMessage(message);
        return response;
    }

    /**
     * 操作失败
     *
     * @param code    错误码
     * @param message 错误消息
     * @return 响应对象
     */
    public static UD17HDocUserAdministrationResponse error(String code, String message) {
        UD17HDocUserAdministrationResponse response = new UD17HDocUserAdministrationResponse();
        response.setCode(code);
        response.setSuccess(false);
        response.setMessage(message);
        return response;
    }

    // ==================== 内部数据类 ====================

    /**
     * 权限项（市场权限+类型+BU）
     * 对应响应格式中的 authList 数组元素
     * type取值: U(Standard User), R(Rule Admin), T(Template Admin),
     * D(Document Auth Admin), A(User Admin), DOCMOD(Adaptation user),
     * MCSU(Market Super User)
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "权限项", description = "用户市场权限信息（含类型代码）")
    public static class AuthItem implements Serializable {
        private static final long serialVersionUID = 1L;
        @ApiModelProperty(value = "市场", example = "-EU")
        private String market;
        @ApiModelProperty(value = "类型代码", example = "U")
        private String type;
        @ApiModelProperty(value = "BU", example = "UD")
        @JsonProperty("BU")
        private String bu;
    }
}
