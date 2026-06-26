package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD05ModifyDocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class UD05ModifyDocumentController {

    @Autowired
    private UD05ModifyDocumentService modifyDocumentService;

    @PostMapping("/ud05/selecthdocadcamodification")
    public ResponseEntity<ApiResponse<List<ModifyDocumentResponse>>> selectHdocAdcaModification(
        @RequestBody ModifyDocumentSelectRequest request) {
        List<ModifyDocumentResponse> list = modifyDocumentService
            .selectHdocAdcaModification(request.getSerie(), request.getChno());
        return ResponseEntity.ok(ApiResponse.success("查询成功", list));
    }

    @PostMapping("/ud05/updatehdocadcamodification")
    public ResponseEntity<ApiResponse<Void>> updateHdocAdcaModification(
        @RequestBody ModifyDocumentUpdateRequest request) {
        modifyDocumentService.updateHdocAdcaModification(
            request.getSerie(), request.getChno(), request.getNewval(),
            request.getDescription(), request.getUpdateUser(), request.getUpdateProcess());
        return ResponseEntity.ok(ApiResponse.success("情报更新成功", null));
    }
}
