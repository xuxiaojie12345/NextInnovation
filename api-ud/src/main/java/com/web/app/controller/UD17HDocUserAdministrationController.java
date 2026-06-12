package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD17HDocUserAdministrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user-admin")
public class UD17HDocUserAdministrationController {

    @Autowired
    private UD17HDocUserAdministrationService ud17HDocUserAdministrationService;

    @PostMapping("/userinfo")
    public UD17UserInfoResponse getUserInfo(@RequestBody UD17UserAdminRequest request) {
        return ud17HDocUserAdministrationService.getUserInfo(request);
    }

    @PostMapping("/update-role")
    public UD17UserAdminResponse updateRole(@RequestBody UD17UserAdminRequest request) {
        return ud17HDocUserAdministrationService.updateRole(request);
    }

    @PostMapping("/delete-role")
    public UD17UserAdminResponse deleteRole(@RequestBody UD17UserAdminRequest request) {
        return ud17HDocUserAdministrationService.deleteRole(request);
    }
}
