package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.response.*;
import com.web.app.dto.request.*;
import com.web.app.service.MasterDataService;
import com.web.app.service.UserAdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class UserAdminController {

    @Autowired
    private UserAdminService userAdminService;
    @Autowired
    private MasterDataService masterDataService;

    @PostMapping("/UD17Userinfo")
    public ApiResponse<UserInfoResponse> userInfo(@RequestBody UD17UserInfoRequest request) {
        return ApiResponse.success(userAdminService.getUserInfo(request.getUserId()));
    }

    @PostMapping("/UD17UpdateRole")
    public ApiResponse<Void> updateRole(@RequestBody UD17UpdateRoleRequest request) {
        userAdminService.updateUserRole(request.getUserId(), request.getPermissions());
        return ApiResponse.success(null, "User roles updated successfully.");
    }

    @PostMapping("/UD17DeleteRole")
    public ApiResponse<Void> deleteRole(@RequestBody UD17DeleteRoleRequest request) {
        userAdminService.deleteUserRole(request.getUserId());
        return ApiResponse.success(null, "User roles deleted successfully.");
    }

    // 前端 User Administration 画面加载 Market 下拉
    @GetMapping("/UD17SelectMarketmaster")
    public ApiResponse<java.util.List<SelectListResponse>> selectMarketmaster() {
        return ApiResponse.success(masterDataService.getMarketList());
    }

    @PostMapping("/UD18SelectHdocFunctionAuth")
    public ApiResponse<HdocFunctionAuthResponse> selectHdocFunctionAuth(@RequestBody UD18UserIdRequest request) {
        return ApiResponse.success(userAdminService.checkFunctionAuth(request.getUserId()));
    }

    @PostMapping("/UD18SelectHdocUserDoc")
    public ApiResponse<HdocUserDocResponse> selectHdocUserDoc(@RequestBody UD18UserIdRequest request) {
        return ApiResponse.success(userAdminService.getUserDoc(request.getUserId()));
    }

    @PostMapping("/UD18DeleteHdocUserDoc")
    public ApiResponse<Void> deleteHdocUserDoc(@RequestBody UD18UserIdRequest request) {
        userAdminService.deleteUserDoc(request.getUserId());
        return ApiResponse.success(null, "User doc permissions deleted successfully");
    }

    @PostMapping("/UD18CreateHdocUserDoc")
    public ApiResponse<Void> createHdocUserDoc(@RequestBody UD18CreateUserDocRequest request) {
        userAdminService.createUserDoc(request.getUserId(), request.getDoctypes());
        return ApiResponse.success(null, "User document permissions updated successfully.");
    }

    @GetMapping("/UD19SelectMarketMaster")
    public ApiResponse<java.util.List<java.util.Map<String, Object>>> selectMarketMaster() {
        // 返回 {market, description} 以便前端下拉直接使用
        java.util.List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
        for (SelectListResponse m : masterDataService.getMarketList()) {
            java.util.Map<String, Object> option = new java.util.HashMap<>();
            option.put("market", m.getCode());
            option.put("description", m.getDescription());
            result.add(option);
        }
        return ApiResponse.success(result);
    }

    @PostMapping("/UD19SearchHdoc")
    public ApiResponse<SearchResultResponse<UserSearchRecord>> searchHdoc(@RequestBody UD19SearchHdocRequest request) {
        return ApiResponse.success(userAdminService.searchHdocUsers(request));
    }
}
