package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.DocumentTypeListResponse;
import com.web.app.service.DocumentListService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/hdoc")
@CrossOrigin(origins = "*")
public class DocumentListController {

    @Autowired
    private DocumentListService documentListService;

    @GetMapping("/document/types")
    public ResponseEntity<ApiResponse<List<DocumentTypeListResponse>>> getDocumentTypes() {
        try {
            List<DocumentTypeListResponse> list = documentListService.getHdocdocumentlist();
            return ResponseEntity.ok(ApiResponse.success(list));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(ApiResponse.error(500, "System error. Please contact administrator."));
        }
    }
}
