package com.web.app.dto.response;

import com.web.app.dto.request.PermissionEntry;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserInfoResponse {
    private String userId;
    private String userName;
    private String role;
    private String email;
    private String responsible;
    private String userPosition;
    // 权限回显：key 为权限名（standardUser/ruleAdmin/...），value 含 enabled 与 market
    private Map<String, PermissionEntry> permissions;
}
