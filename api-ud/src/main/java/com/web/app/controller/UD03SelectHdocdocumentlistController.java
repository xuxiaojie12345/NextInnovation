package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.entity.HdocDocumentList;
import com.web.app.service.UD03SelectHdocdocumentlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class UD03SelectHdocdocumentlistController {

    @Autowired
    private UD03SelectHdocdocumentlistService selectHdocdocumentlistService;

    @PostMapping("/ud03/selecthdocdocumentlist")
    public ResponseEntity<ApiResponse<List<HdocDocumentList>>> selectHdocDocumentList() {
        List<HdocDocumentList> list = selectHdocdocumentlistService.selectHdocDocumentList();
        return ResponseEntity.ok(ApiResponse.success("查询成功", list));
    }
}
