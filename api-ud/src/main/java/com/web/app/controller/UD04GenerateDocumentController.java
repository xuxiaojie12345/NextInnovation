package com.web.app.controller;

import com.web.app.dto.UD04GenerateDocumentRequest;
import com.web.app.dto.UD04GenerateDocumentResponse;
import com.web.app.service.UD04GenerateDocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ud04")
public class UD04GenerateDocumentController {

    @Autowired
    private UD04GenerateDocumentService ud04GenerateDocumentService;

    @PostMapping("/generate-document")
    public UD04GenerateDocumentResponse generateDocument(@RequestBody UD04GenerateDocumentRequest request) {
        return ud04GenerateDocumentService.getGeneratedDocumentInfo(request);
    }
}
