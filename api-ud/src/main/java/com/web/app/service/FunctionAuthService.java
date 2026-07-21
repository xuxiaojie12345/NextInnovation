package com.web.app.service;

import com.web.app.dto.response.PermissionResponse;
import java.util.List;

public interface FunctionAuthService {
    PermissionResponse getUserFunctionAuth(String userId);
    List<String> getUserFunctionCodes(String userId);
}
