package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD18HDocUserDocAdministrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user-doc-admin")
public class UD18HDocUserDocAdministrationController {

    @Autowired
    private UD18HDocUserDocAdministrationService ud18HDocUserDocAdministrationService;

    @GetMapping("/document-list")
    public UD18DocumentListResponse getDocumentList() {
        return ud18HDocUserDocAdministrationService.getDocumentList();
    }

    @PostMapping("/select-user-doc")
    public UD18UserDocResponse selectUserDoc(@RequestBody UD18UserDocAdminRequest request) {
        return ud18HDocUserDocAdministrationService.selectUserDoc(request);
    }

    @PostMapping("/update-user-doc")
    public UD18UpdateUserDocResponse updateUserDoc(@RequestBody UD18UserDocAdminRequest request) {
        return ud18HDocUserDocAdministrationService.updateUserDoc(request);
    }
}
