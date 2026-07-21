package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.response.DocumentTypeListResponse;
import com.web.app.dto.response.DocumentListRecord;
import com.web.app.dto.response.SearchResultResponse;
import com.web.app.service.DocumentListService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class DocumentController {

    @Autowired
    private DocumentListService documentListService;

    @GetMapping("/UD03SelectHdocdocumentlistApi")
    public ApiResponse<DocumentTypeListResponse> getDocumentTypes() {
        return ApiResponse.success(documentListService.getDocumentTypes());
    }

    @GetMapping("/UD20SelectHdocDocumentList")
    public ApiResponse<SearchResultResponse<DocumentListRecord>> getDocumentList() {
        List<DocumentListRecord> records = documentListService.getDocumentList();
        SearchResultResponse<DocumentListRecord> resp = new SearchResultResponse<>(records.size(), records);
        return ApiResponse.success(resp);
    }
}
