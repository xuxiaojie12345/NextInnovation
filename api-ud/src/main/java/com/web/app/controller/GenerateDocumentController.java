package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.response.DocumentDataResponse;
import com.web.app.dto.response.VehicleSpecificationResponse;
import com.web.app.service.GenerateDocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class GenerateDocumentController {

    @Autowired
    private GenerateDocumentService generateDocumentService;

    @GetMapping("/UD04SelectGeneratedocumentApi")
    public ApiResponse<DocumentDataResponse> generateDocument(
            @RequestParam String chassisNo, @RequestParam String docType) {
        DocumentDataResponse data = generateDocumentService.generateDocument(chassisNo, docType);
        return ApiResponse.success(data);
    }
}
