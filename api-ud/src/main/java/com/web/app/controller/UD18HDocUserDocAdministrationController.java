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
 * 功能说明：提供用户文档权限检查、查询、新增、删除接口
 * 对应全体API設計：UD18HDocUserDocAdministrationApi
 * - 4.1 GET /checkauth - 检查用户权限
 * - 4.2 GET /getuserdoc - 获取用户文档类型
 * - 4.3 POST /createdoc - 新增文档权限（对应5.38.1）
 * - 4.4 POST /deleteedoc - 删除文档权限（对应5.38.2）
 *
 * @author GitHub Copilot
 * @version 2.0
 * @date 2026-06-30
 */
@Slf4j
@RestController
@RequestMapping("/api/ud18")
@Api(tags = "UD18 - 用户文档权限管理")
public class UD18HDocUserDocAdministrationController {

    @Autowired
    private UD18HDocUserDocAdministrationService ud18Service;

    @GetMapping("/checkauth")
    @ApiOperation(value = "4.1 - 检查用户权限", notes = "根据用户ID检查HDOC_FUNCTION_AUTH表中是否存在该用户")
    public UD18HDocUserDocAdministrationResponse checkAuth(
            @ApiParam(value = "用户ID", required = true, example = "user123") @RequestParam("userId") String userId) {
        UD18HDocUserDocAdministrationRequest request = new UD18HDocUserDocAdministrationRequest();
        request.setUserId(userId);
        return ud18Service.checkAuth(request);
    }

    @GetMapping("/getuserdoc")
    @ApiOperation(value = "4.2 - 获取用户文档类型", notes = "根据用户ID查询HDOC_USER_DOC表中的文档类型（doctype可选）")
    public UD18HDocUserDocAdministrationResponse getUserDoc(
            @ApiParam(value = "用户ID", required = true, example = "user123") @RequestParam("userId") String userId,
            @ApiParam(value = "文档类型（可选）", example = "Homologation Certificate") @RequestParam(value = "doctype", required = false) String doctype) {
        UD18HDocUserDocAdministrationRequest request = new UD18HDocUserDocAdministrationRequest();
        request.setUserId(userId);
        request.setDoctype(doctype);
        return ud18Service.getUserDoc(request);
    }

    @PostMapping("/createdoc")
    @ApiOperation(value = "4.3 - 新增用户文档权限", notes = "对应5.38.1，插入HDOC_USER_DOC表")
    public UD18HDocUserDocAdministrationResponse createDoc(@RequestBody UD18HDocUserDocAdministrationRequest request) {
        return ud18Service.createDoc(request);
    }

    @PostMapping("/deleteedoc")
    @ApiOperation(value = "4.4 - 删除用户文档权限", notes = "对应5.38.2，从HDOC_USER_DOC表删除")
    public UD18HDocUserDocAdministrationResponse deleteDoc(@RequestBody UD18HDocUserDocAdministrationRequest request) {
        return ud18Service.deleteDoc(request);
    }
}
