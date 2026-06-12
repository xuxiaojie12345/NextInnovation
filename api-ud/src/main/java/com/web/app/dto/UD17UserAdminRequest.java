package com.web.app.dto;

import lombok.Data;
import java.util.List;

@Data
public class UD17UserAdminRequest {
    private String userid;
    private List<PermissionInfo> permissions;

    @Data
    public static class PermissionInfo {
        private String role;
        private List<String> markets;
    }
}
