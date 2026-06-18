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
        log.info("========== UD17 Controller: Get Market List ==========");

        ApiResponse<?> response = ud17Service.getMarketList();

        log.info("Response code: {}, msg: {}", response.getCode(), response.getMsg());
        log.info("========== UD17 Controller: Get Market List completed ==========");

        return ResponseEntity.ok(response);
    }

    /**
     * 获取用户信息
     * POST /api/ud17HDocUserAdministration/getUserInfo
     */
    @PostMapping("/getUserInfo")
    public ResponseEntity<ApiResponse<?>> getUserInfo(@RequestBody HdocDocumentList request) {
        log.info("========== UD17 Controller: Get User Info ==========");
        log.info("userId: {}, userName: {}", request.getUserId(), request.getUserName());

        ApiResponse<?> response = ud17Service.getUserInfo(request);

        log.info("Response code: {}, msg: {}", response.getCode(), response.getMsg());
        log.info("========== UD17 Controller: Get User Info completed ==========");

        return ResponseEntity.ok(response);
    }

    /**
     * 获取用户权限
     * POST /api/ud17HDocUserAdministration/getUserPermissions
     */
    @PostMapping("/getUserPermissions")
    public ResponseEntity<ApiResponse<?>> getUserPermissions(@RequestBody HdocDocumentList request) {
        log.info("========== UD17 Controller: Get User Permissions ==========");
        log.info("userId: {}", request.getUserId());

        ApiResponse<?> response = ud17Service.getUserPermissions(request);

        log.info("Response code: {}, msg: {}", response.getCode(), response.getMsg());
        log.info("========== UD17 Controller: Get User Permissions completed ==========");

        return ResponseEntity.ok(response);
    }

    /**
     * 更新用户角色
     * PUT /api/ud17HDocUserAdministration/updateRole
     */
    @PutMapping("/updateRole")
    public ResponseEntity<ApiResponse<?>> updateRole(@RequestBody HdocDocumentList request) {
        log.info("========== UD17 Controller: Update Role ==========");
        log.info("userId: {}, market: {}, type: {}, bu: {}, function: {}",
                request.getUserId(), request.getMarket(), request.getType(),
                request.getBu(), request.getFunction());

        ApiResponse<?> response = ud17Service.updateRole(request);

        log.info("Response code: {}, msg: {}", response.getCode(), response.getMsg());
        log.info("========== UD17 Controller: Update Role completed ==========");

        return ResponseEntity.ok(response);
    }

    /**
     * 删除用户角色
     * DELETE /api/ud17HDocUserAdministration/deleteRole
     */
    @DeleteMapping("/deleteRole")
    public ResponseEntity<ApiResponse<?>> deleteRole(@RequestBody HdocDocumentList request) {
        log.info("========== UD17 Controller: Delete Role ==========");
        log.info("userId: {}, market: {}, type: {}, bu: {}, function: {}",
                request.getUserId(), request.getMarket(), request.getType(),
                request.getBu(), request.getFunction());

        ApiResponse<?> response = ud17Service.deleteRole(request);

        log.info("Response code: {}, msg: {}", response.getCode(), response.getMsg());
        log.info("========== UD17 Controller: Delete Role completed ==========");

        return ResponseEntity.ok(response);
    }
}
