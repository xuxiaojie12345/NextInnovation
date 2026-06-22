package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.service.UD20DocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/hdoc/ud20")
@CrossOrigin(origins = "*")
public class UD20DocumentController {

    @Autowired
    private UD20DocumentService ud20DocumentService;

    @PostMapping("/getDocumentList")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDocumentList() {
        try {
            List<Map<String, Object>> documentList = ud20DocumentService.getDocumentList();
            Map<String, Object> data = new HashMap<>();
            data.put("documentList", documentList != null ? documentList : new ArrayList<>());
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(ApiResponse.error(500, "System error. Please contact administrator."));
        }
    }
}
