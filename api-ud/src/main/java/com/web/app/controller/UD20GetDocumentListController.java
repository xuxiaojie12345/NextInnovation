package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.DocListResponse;
import com.web.app.dto.Ud20Request;
import java.util.List;
import com.web.app.service.UD20GetDocumentListService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class UD20GetDocumentListController {

    @Autowired
    private UD20GetDocumentListService getDocumentListService;

    @PostMapping("/ud20/selectehdocdocumentlist")
    public ResponseEntity<ApiResponse<List<DocListResponse>>> selectHdocDocumentList(@RequestBody Ud20Request request) {
        try {
            List<DocListResponse> list = getDocumentListService.selectHdocDocumentList(request.getDoctype());
            return ResponseEntity.ok(ApiResponse.success("情报获取成功", list));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(ApiResponse.error(401, e.getMessage()));
        }
    }

    @PostMapping("/ud20/selecthdocdocumentlist")
    public ResponseEntity<ApiResponse<List<DocListResponse>>> selectAllHdocDocumentList() {
        try {
            List<DocListResponse> list = getDocumentListService.selectHdocDocumentList(null);
            return ResponseEntity.ok(ApiResponse.success("查询成功", list));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(ApiResponse.error(401, e.getMessage()));
        }
    }
}
