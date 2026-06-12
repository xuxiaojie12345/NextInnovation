package com.web.app.controller;

import com.web.app.dto.UD20GetDocumentListResponse;
import com.web.app.service.UD20GetDocumentListService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/market-document-settings-list")
public class UD20GetDocumentListController {

    @Autowired
    private UD20GetDocumentListService ud20GetDocumentListService;

    @GetMapping("/document-list")
    public UD20GetDocumentListResponse getDocumentList() {
        return ud20GetDocumentListService.selectHdocDocumentList();
    }
}
