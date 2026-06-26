package com.web.app.controller;

import com.web.app.dto.UD17HDocUserAdministrationRequest;
import com.web.app.dto.UD17HDocUserAdministrationResponse;
import com.web.app.service.UD17HDocUserAdministrationService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD17 用户权限管理控制器
 *
 * 功能说明：提供用户权限查询、更新、删除接口
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@RestController
@RequestMapping("/api/ud17")
@Api(tags = "UD17 - 用户权限管理")
public class UD17HDocUserAdministrationController {

    @Autowired
    private UD17HDocUserAdministrationService ud17Service;

    @GetMapping("/userinfo")
    @ApiOperation(value = "获取用户权限信息", notes = "根据用户ID查询用户的机能权限和市场权限")
    public UD17HDocUserAdministrationResponse userInfo(
            @ApiParam(value = "用户ID", required = true, example = "user123") @RequestParam("userid") String userid) {
        log.info("收到UD17查询用户权限信息请求, userid: {}", userid);
        UD17HDocUserAdministrationRequest request = new UD17HDocUserAdministrationRequest();
        request.setUserid(userid);
        return ud17Service.userInfo(request);
    }

    @PutMapping("/updaterole")
    @ApiOperation(value = "更新用户角色权限", notes = "更新用户的机能权限和市场权限")
    public UD17HDocUserAdministrationResponse updateRole(@RequestBody UD17HDocUserAdministrationRequest request) {
        log.info("收到UD17更新用户角色权限请求, userid: {}", request.getUserid());
        return ud17Service.updateRole(request);
    }

    @DeleteMapping("/deleteuser")
    @ApiOperation(value = "删除用户权限", notes = "删除用户的机能权限和市场权限")
    public UD17HDocUserAdministrationResponse deleteUser(
            @ApiParam(value = "用户ID", required = true, example = "user123") @RequestParam("userid") String userid) {
        log.info("收到UD17删除用户权限请求, userid: {}", userid);
        UD17HDocUserAdministrationRequest request = new UD17HDocUserAdministrationRequest();
        request.setUserid(userid);
        return ud17Service.deleteUser(request);
    }
}
