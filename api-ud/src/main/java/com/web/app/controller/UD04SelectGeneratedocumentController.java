package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.SelectGenerateDocumentRequest;
import com.web.app.dto.SelectGenerateDocumentResponse;
import com.web.app.service.UD04SelectGeneratedocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class UD04SelectGeneratedocumentController {

    @Autowired
    private UD04SelectGeneratedocumentService selectGeneratedocumentService;

    @PostMapping("/ud04/selecthdocrecdataom")
    public ResponseEntity<ApiResponse<SelectGenerateDocumentResponse>> selectHdocRecDataOm(
        @RequestBody SelectGenerateDocumentRequest request) {
        SelectGenerateDocumentResponse response = selectGeneratedocumentService
            .selectHdocRecDataOm(request.getChassisSeries(), request.getChassisNo());
        return ResponseEntity.ok(ApiResponse.success("查询成功", response));
    }
}
