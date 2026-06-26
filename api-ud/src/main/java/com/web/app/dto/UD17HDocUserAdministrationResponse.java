package com.web.app.dto;

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
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
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

    @ApiModelProperty(value = "市场权限列表")
    private List<MarketAuthData> marketAuths;

    @ApiModelProperty(value = "机能权限列表")
    private List<String> functionAuths;

    // ==================== 静态工厂方法 ====================

    public static UD17HDocUserAdministrationResponse success(String userId, List<MarketAuthData> marketAuths,
            List<String> functionAuths) {
        UD17HDocUserAdministrationResponse response = new UD17HDocUserAdministrationResponse();
        response.setCode("200");
        response.setSuccess(true);
        response.setMessage("查询成功");
        response.setUserId(userId);
        response.setMarketAuths(marketAuths);
        response.setFunctionAuths(functionAuths);
        return response;
    }

    public static UD17HDocUserAdministrationResponse updateSuccess(String message) {
        UD17HDocUserAdministrationResponse response = new UD17HDocUserAdministrationResponse();
        response.setCode("200");
        response.setSuccess(true);
        response.setMessage(message);
        return response;
    }

    public static UD17HDocUserAdministrationResponse error(String code, String message) {
        UD17HDocUserAdministrationResponse response = new UD17HDocUserAdministrationResponse();
        response.setCode(code);
        response.setSuccess(false);
        response.setMessage(message);
        return response;
    }

    // ==================== 内部数据类 ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "市场权限数据", description = "用户市场权限信息")
    public static class MarketAuthData implements Serializable {
        private static final long serialVersionUID = 1L;
        @ApiModelProperty(value = "角色类型", example = "Standard User")
        private String roleType;
        @ApiModelProperty(value = "市场", example = "-EU")
        private String market;
    }
}
