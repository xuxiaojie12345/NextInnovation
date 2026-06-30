package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD17HdocUserAdministrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class UD17HdocUserAdministrationController {

    @Autowired
    private UD17HdocUserAdministrationService userAdministrationService;

    @PostMapping("/ud17/userinfo")
    public ResponseEntity<ApiResponse<List<UserInfoResponse>>> userInfo(
        @RequestBody UserIdRequest request) {
        List<UserInfoResponse> list = userAdministrationService.getUserInfo(request.getUserId());
        return ResponseEntity.ok(ApiResponse.success("登录成功", list));
    }

    @PostMapping("/ud17/updaterole")
    public ResponseEntity<ApiResponse<Void>> updateRole(@RequestBody UpdateRoleRequest request) {
        try {
            userAdministrationService.updateRole(request.getUserId(),
                request.getUpdateUser() != null ? request.getUpdateUser() : request.getUserId(),
                request.getUpdateProcess(),
                request.getMarketAuthList(),
                request.getFunctionAuthList());
            return ResponseEntity.ok(ApiResponse.success("用户权限更新成功", null));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(ApiResponse.error(401, e.getMessage()));
        }
    }

    @PostMapping("/ud17/deleterole")
    public ResponseEntity<ApiResponse<Void>> deleteRole(@RequestBody UserIdRequest request) {
        userAdministrationService.deleteRole(request.getUserId());
        return ResponseEntity.ok(ApiResponse.success("用户权限删除成功", null));
    }
}
