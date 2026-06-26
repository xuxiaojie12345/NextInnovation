package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD11HdocvariablesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class UD11HdocvariablesController {

    @Autowired
    private UD11HdocvariablesService hdocvariablesService;

    @PostMapping("/ud11/search")
    public ResponseEntity<ApiResponse<List<HdocVariablesResponse>>> search(
        @RequestBody Ud11SearchRequest request) {
        List<HdocVariablesResponse> list = hdocvariablesService.searchHdocVariables(request);
        return ResponseEntity.ok(ApiResponse.success("数据检索成功", list));
    }

    @PostMapping("/ud11/selecthdocvariablescount")
    public ResponseEntity<ApiResponse<CountResponse>> count(@RequestBody Ud11SearchRequest request) {
        CountResponse response = hdocvariablesService.countHdocVariables(request);
        return ResponseEntity.ok(ApiResponse.success("总件数检索成功", response));
    }
}
