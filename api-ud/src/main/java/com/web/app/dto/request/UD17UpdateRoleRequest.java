package com.web.app.dto.request;

import lombok.Data;
import java.util.Map;

@Data
public class UD17UpdateRoleRequest {
    private String userId;
    private Map<String, PermissionEntry> permissions;
    // 兼容旧调用方：仍接受 roles（List<String>）但以 permissions 为准
    private java.util.List<String> roles;
}
