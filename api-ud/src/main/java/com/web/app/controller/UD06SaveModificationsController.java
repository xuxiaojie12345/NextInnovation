package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD06SaveModificationsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class UD06SaveModificationsController {

    @Autowired
    private UD06SaveModificationsService saveModificationsService;

    @PostMapping("/ud06/selecthdocadcamodification")
    public ResponseEntity<ApiResponse<List<SaveModificationsResponse>>> selectHdocAdcaModification(
        @RequestBody SaveModificationsRequest request) {
        List<SaveModificationsResponse> list = saveModificationsService
            .selectHdocAdcaModification(request.getSerie(), request.getChno());
        return ResponseEntity.ok(ApiResponse.success("查询成功", list));
    }
}
