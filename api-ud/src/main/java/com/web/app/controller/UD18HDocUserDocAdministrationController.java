package com.web.app.controller;

import com.web.app.dto.UD18HDocUserDocAdministrationRequest;
import com.web.app.dto.UD18HDocUserDocAdministrationResponse;
import com.web.app.service.UD18HDocUserDocAdministrationService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD18 用户文档权限管理控制器
 *
 * 功能说明：提供用户文档权限检查、查询、更新接口
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@RestController
@RequestMapping("/api/ud18")
@Api(tags = "UD18 - 用户文档权限管理")
public class UD18HDocUserDocAdministrationController {

    @Autowired
    private UD18HDocUserDocAdministrationService ud18Service;

    @GetMapping("/checkauth")
    @ApiOperation(value = "检查用户权限", notes = "根据用户ID检查用户是否存在并返回用户基本信息")
    public UD18HDocUserDocAdministrationResponse checkAuth(
            @ApiParam(value = "用户ID", required = true, example = "user123") @RequestParam("userId") String userId) {
        log.info("收到UD18检查用户权限请求, userId: {}", userId);
        UD18HDocUserDocAdministrationRequest request = new UD18HDocUserDocAdministrationRequest();
        request.setUserId(userId);
        return ud18Service.checkAuth(request);
    }

    @GetMapping("/getuserdoc")
    @ApiOperation(value = "获取用户文档类型", notes = "根据用户ID查询用户的文档类型权限")
    public UD18HDocUserDocAdministrationResponse getUserDoc(
            @ApiParam(value = "用户ID", required = true, example = "user123") @RequestParam("userId") String userId) {
        log.info("收到UD18获取用户文档类型请求, userId: {}", userId);
        UD18HDocUserDocAdministrationRequest request = new UD18HDocUserDocAdministrationRequest();
        request.setUserId(userId);
        return ud18Service.getUserDoc(request);
    }

    @PutMapping("/updatedoc")
    @ApiOperation(value = "更新用户文档权限", notes = "更新用户在HDOC_USER_DOC表中的文档类型")
    public UD18HDocUserDocAdministrationResponse updateDoc(@RequestBody UD18HDocUserDocAdministrationRequest request) {
        log.info("收到UD18更新用户文档权限请求, userId: {}, doctype: {}", request.getUserId(), request.getDoctype());
        return ud18Service.updateDoc(request);
    }
}
