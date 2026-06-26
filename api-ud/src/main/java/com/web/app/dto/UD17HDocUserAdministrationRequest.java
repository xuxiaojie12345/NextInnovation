package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

/**
 * UD17 - HDoc User Administration请求DTO
 */
@Data
public class UD17HDocUserAdministrationRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 用户ID */
    private String userid;

    /** 权限信息（更新角色时使用） */
    private List<PermissionItem> permissions;

    /**
     * 权限项
     */
    @Data
    public static class PermissionItem implements Serializable {
        private static final long serialVersionUID = 1L;

        /** 角色名称（如：Standard User, Rule Admin 等） */
        private String role;

        /** 市场列表 */
        private List<String> markets;
    }
}
