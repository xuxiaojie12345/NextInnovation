package com.web.app.controller;

import com.web.app.dto.UD17HDocUserAdministrationRequest;
import com.web.app.dto.UD17HDocUserAdministrationResponse;
import com.web.app.service.UD17HDocUserAdministrationService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD17 - HDoc User Administration API控制器
 */
@RestController
@RequestMapping("/api/UD17HDocUserAdministrationApi")
@Api(tags = "UD17-HDoc User Administration API")
public class UD17HDocUserAdministrationController {

    @Autowired
    private UD17HDocUserAdministrationService ud17HDocUserAdministrationService;

    @PostMapping("/UD17Userinfo")
    @ApiOperation("查询用户信息")
    public UD17HDocUserAdministrationResponse getUserInfo(@RequestBody UD17HDocUserAdministrationRequest request) {
        return ud17HDocUserAdministrationService.getUserInfo(request);
    }

    @PostMapping("/UD17UpdateRole")
    @ApiOperation("更新用户角色")
    public UD17HDocUserAdministrationResponse updateRole(@RequestBody UD17HDocUserAdministrationRequest request) {
        return ud17HDocUserAdministrationService.updateRole(request);
    }

    @PostMapping("/UD17DeleteRole")
    @ApiOperation("删除用户角色")
    public UD17HDocUserAdministrationResponse deleteRole(@RequestBody UD17HDocUserAdministrationRequest request) {
        return ud17HDocUserAdministrationService.deleteRole(request);
    }
}
