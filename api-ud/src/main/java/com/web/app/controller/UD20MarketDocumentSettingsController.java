package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD20MarketDocumentSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class UD20MarketDocumentSettingsController {

    @Autowired
    private UD20MarketDocumentSettingsService marketDocumentSettingsService;

    @PostMapping("/ud20-1/updatehdocdocumentlist")
    public ResponseEntity<ApiResponse<Void>> updateHdocDocumentList(@RequestBody Ud20UpdateRequest request) {
        try {
            marketDocumentSettingsService.updateHdocDocumentList(request);
            return ResponseEntity.ok(ApiResponse.success("情报更新成功", null));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(ApiResponse.error(401, e.getMessage()));
        }
    }
}
