package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocDocumentList;
import com.web.app.service.UD17Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * UD17 Controller
 * 提供HDoc用户管理的API接口
 */
@Slf4j
@RestController
@RequestMapping("/api/ud17HDocUserAdministration")
@CrossOrigin(
    origins = "*",
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class UD17Controller {

    @Autowired
    private UD17Service ud17Service;

    /**
     * 获取市场列表
     * GET /api/ud17HDocUserAdministration/getMarketList
     */
    @GetMapping("/getMarketList")
    public ResponseEntity<ApiResponse<?>> getMarketList() {

        ApiResponse<?> response = ud17Service.getMarketList();

        return ResponseEntity.ok(response);
    }

    /**
     * 获取用户信息
     * POST /api/ud17HDocUserAdministration/getUserInfo
     */
    @PostMapping("/getUserInfo")
    public ResponseEntity<ApiResponse<?>> getUserInfo(@RequestBody HdocDocumentList request) {

        ApiResponse<?> response = ud17Service.getUserInfo(request);

        return ResponseEntity.ok(response);
    }

    /**
     * 获取用户权限
     * POST /api/ud17HDocUserAdministration/getUserPermissions
     */
    @PostMapping("/getUserPermissions")
    public ResponseEntity<ApiResponse<?>> getUserPermissions(@RequestBody HdocDocumentList request) {

        ApiResponse<?> response = ud17Service.getUserPermissions(request);

        return ResponseEntity.ok(response);
    }

    /**
     * 更新用户角色
     * POST /api/ud17HDocUserAdministration/updateRole
     */
    @PostMapping("/updateRole")
    public ResponseEntity<ApiResponse<?>> updateRole(@RequestBody HdocDocumentList request) {

        ApiResponse<?> response = ud17Service.updateRole(request);

        return ResponseEntity.ok(response);
    }

    /**
     * 删除用户角色
     * DELETE /api/ud17HDocUserAdministration/deleteRole
     */
    @DeleteMapping("/deleteRole")
    public ResponseEntity<ApiResponse<?>> deleteRole(@RequestBody HdocDocumentList request) {

        ApiResponse<?> response = ud17Service.deleteRole(request);

        return ResponseEntity.ok(response);
    }
}
