package com.web.app.controller;

import com.web.app.dto.UD10HdocvariablesRequest;
import com.web.app.dto.UD10HdocvariablesResponse;
import com.web.app.service.UD10HdocvariablesService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD10 - HDoc变量操作API控制器
 */
@RestController
@RequestMapping("/api/UD10HdocvariablesApi")
@Api(tags = "UD10-HDoc变量操作API")
public class UD10HdocvariablesController {

    @Autowired
    private UD10HdocvariablesService ud10HdocvariablesService;

    @PostMapping("/UD10Add")
    @ApiOperation("新增变量")
    public UD10HdocvariablesResponse add(@RequestBody UD10HdocvariablesRequest request) {
        return ud10HdocvariablesService.addVariable(request);
    }

    @PostMapping("/UD10Update")
    @ApiOperation("更新变量")
    public UD10HdocvariablesResponse update(@RequestBody UD10HdocvariablesRequest request) {
        return ud10HdocvariablesService.updateVariable(request);
    }

    @PostMapping("/UD10Delete")
    @ApiOperation("删除变量")
    public UD10HdocvariablesResponse delete(@RequestBody UD10HdocvariablesRequest request) {
        return ud10HdocvariablesService.deleteVariable(request);
    }
}
