package com.web.app.controller;

import com.web.app.dto.UD18HDocUserDocAdministrationRequest;
import com.web.app.dto.UD18HDocUserDocAdministrationResponse;
import com.web.app.service.UD18HDocUserDocAdministrationService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD18 - HDoc User Doc Administration API控制器
 */
@RestController
@RequestMapping("/api/UD18HDocUserDocAdministrationApi")
@Api(tags = "UD18-HDoc User Doc Administration API")
public class UD18HDocUserDocAdministrationController {

    @Autowired
    private UD18HDocUserDocAdministrationService ud18HDocUserDocAdministrationService;

    @GetMapping("/document-list")
    @ApiOperation("获取全部文档列表")
    public UD18HDocUserDocAdministrationResponse getDocumentList() {
        return ud18HDocUserDocAdministrationService.getDocumentList();
    }

    @PostMapping("/select-user-doc")
    @ApiOperation("查询用户文档权限")
    public UD18HDocUserDocAdministrationResponse selectUserDoc(@RequestBody UD18HDocUserDocAdministrationRequest request) {
        return ud18HDocUserDocAdministrationService.selectUserDoc(request);
    }

    @PostMapping("/update-user-doc")
    @ApiOperation("更新用户文档权限")
    public UD18HDocUserDocAdministrationResponse updateUserDoc(@RequestBody UD18HDocUserDocAdministrationRequest request) {
        return ud18HDocUserDocAdministrationService.updateUserDoc(request);
    }
}
