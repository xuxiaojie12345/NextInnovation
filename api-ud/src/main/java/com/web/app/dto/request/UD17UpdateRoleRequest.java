package com.web.app.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class UD17UpdateRoleRequest {
    private String userId;
    private List<String> roles;
}
