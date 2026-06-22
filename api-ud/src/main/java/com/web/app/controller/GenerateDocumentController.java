package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.GenerateDocumentRequest;
import com.web.app.dto.GenerateDocumentResponse;
import com.web.app.service.GenerateDocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc")
@CrossOrigin(origins = "*")
public class GenerateDocumentController {

    @Autowired
    private GenerateDocumentService generateDocumentService;

    @PostMapping("/generatedocument")
    public ResponseEntity<ApiResponse<GenerateDocumentResponse>> getGenerateDocument(
            @RequestBody GenerateDocumentRequest request) {
        try {
            // 参数校验
            if (request.getSerie() == null || request.getSerie().trim().isEmpty() ||
                request.getChnr() == null || request.getChnr().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "Invalid chassis information."));
            }

            GenerateDocumentResponse data = generateDocumentService.getGeneratedocument(request);

            if (data != null) {
                return ResponseEntity.ok(ApiResponse.success(data));
            } else {
                return ResponseEntity.status(404)
                    .body(ApiResponse.error(404, "Vehicle data not found."));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(400, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(ApiResponse.error(500, "System error. Please contact administrator."));
        }
    }
}
