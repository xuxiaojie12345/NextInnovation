package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD10HdocvariablesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class UD10HdocvariablesController {

    @Autowired
    private UD10HdocvariablesService hdocvariablesService;

    @PostMapping("/ud10/update")
    public ResponseEntity<ApiResponse<Void>> update(@RequestBody Ud10VariableRequest request) {
        hdocvariablesService.updateVariable(request);
        return ResponseEntity.ok(ApiResponse.success("数据更新成功", null));
    }

    @PostMapping("/ud10/add")
    public ResponseEntity<ApiResponse<Void>> add(@RequestBody Ud10VariableRequest request) {
        hdocvariablesService.addVariable(request);
        return ResponseEntity.ok(ApiResponse.success("数据登录成功", null));
    }

    @PostMapping("/ud10/delete")
    public ResponseEntity<ApiResponse<Void>> delete(@RequestBody Ud10VariableRequest request) {
        hdocvariablesService.deleteVariable(request);
        return ResponseEntity.ok(ApiResponse.success("数据删除成功", null));
    }
}
