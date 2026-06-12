package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD05ModifyDocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ud05")
public class UD05ModifyDocumentController {

    @Autowired
    private UD05ModifyDocumentService ud05ModifyDocumentService;

    @PostMapping("/select-variable-modification")
    public SelectVariableModificationResponse selectVariableModification(@RequestBody UD05SelectVariableRequest request) {
        return ud05ModifyDocumentService.selectVariableModification(request);
    }

    @PostMapping("/update-modification")
    public UpdateModificationResponse updateModification(@RequestBody UD05UpdateModificationRequest request) {
        return ud05ModifyDocumentService.updateModification(request);
    }
}
