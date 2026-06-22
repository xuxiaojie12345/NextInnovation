package com.web.app.controller;

import com.web.app.dto.UD11HdocvariablesRequest;
import com.web.app.dto.UD11HdocvariablesResponse;
import com.web.app.service.UD11HdocvariablesService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD11 - HDoc变量搜索API控制器
 */
@RestController
@RequestMapping("/api/UD11HdocvariablesApi")
@Api(tags = "UD11-HDoc变量搜索API")
public class UD11HdocvariablesController {

    @Autowired
    private UD11HdocvariablesService ud11HdocvariablesService;

    @PostMapping("/UD11Search")
    @ApiOperation("搜索HDoc变量")
    public UD11HdocvariablesResponse search(@RequestBody UD11HdocvariablesRequest request) {
        return ud11HdocvariablesService.searchVariables(request);
    }
}
