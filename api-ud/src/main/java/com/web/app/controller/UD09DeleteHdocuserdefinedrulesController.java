package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD09DeleteHdocuserdefinedrulesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class UD09DeleteHdocuserdefinedrulesController {

    @Autowired
    private UD09DeleteHdocuserdefinedrulesService deleteHdocuserdefinedrulesService;

    @PostMapping("/ud09/search")
    public ResponseEntity<ApiResponse<List<Ud09SearchResponse>>> search(
        @RequestBody Ud09SearchRequest request) {
        List<Ud09SearchResponse> list = deleteHdocuserdefinedrulesService.searchHdocUserDefinedRules(request);
        return ResponseEntity.ok(ApiResponse.success("数据获取成功", list));
    }

    @PostMapping("/ud09/deleteselected")
    public ResponseEntity<ApiResponse<Void>> deleteSelected(@RequestBody Ud09SearchRequest request) {
        deleteHdocuserdefinedrulesService.deleteSelected(request);
        return ResponseEntity.ok(ApiResponse.success("数据删除成功", null));
    }

    @PostMapping("/ud09/selecthdocuserdefinedrulescount")
    public ResponseEntity<ApiResponse<CountResponse>> count(@RequestBody Ud09SearchRequest request) {
        int count = deleteHdocuserdefinedrulesService.countHdocUserDefinedRules(request);
        CountResponse response = new CountResponse();
        response.setCount(count);
        return ResponseEntity.ok(ApiResponse.success("数据获取成功", response));
    }
}
