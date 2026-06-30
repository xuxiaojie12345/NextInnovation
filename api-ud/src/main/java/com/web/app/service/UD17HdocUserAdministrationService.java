package com.web.app.service;

import com.web.app.dto.UserInfoResponse;
import com.web.app.dto.UpdateRoleRequest;
import java.util.List;

public interface UD17HdocUserAdministrationService {
    List<UserInfoResponse> getUserInfo(String userId);
    void updateRole(String userId, String updateUser, String updateProcess,
                    List<com.web.app.dto.UpdateRoleRequest.MarketAuthItem> marketAuthList,
                    List<com.web.app.dto.UpdateRoleRequest.FunctionAuthItem> functionAuthList);
    void deleteRole(String userId);
}
