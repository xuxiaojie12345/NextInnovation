package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD20MarketDocumentSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/market-document-settings")
public class UD20MarketDocumentSettingsController {

    @Autowired
    private UD20MarketDocumentSettingsService ud20MarketDocumentSettingsService;

    @PostMapping("/update")
    public UD20MarketDocumentSettingsResponse update(@RequestBody UD20MarketDocumentSettingsRequest request) {
        return ud20MarketDocumentSettingsService.updateHdocDocumentList(request);
    }
}
