package com.web.app.controller;

import com.web.app.dto.UD10HdocvariablesRequest;
import com.web.app.dto.UD10HdocvariablesResponse;
import com.web.app.service.UD10HdocvariablesService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD10 HDOC变量管理控制器
 *
 * 功能说明：提供HDOC变量的新增、更新、删除接口
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@RestController
@RequestMapping("/api/ud10")
@Api(tags = "UD10 - HDOC变量管理")
public class UD10HdocvariablesController {

    @Autowired
    private UD10HdocvariablesService ud10Service;

    @PostMapping("/add")
    @ApiOperation(value = "新增变量", notes = "向HDOC_VARIABLES表新增一个变量")
    public UD10HdocvariablesResponse addVariable(@RequestBody UD10HdocvariablesRequest request) {
        return ud10Service.UD10Add(request);
    }

    @PostMapping("/update")
    @ApiOperation(value = "更新变量", notes = "更新HDOC_VARIABLES表中的变量数据")
    public UD10HdocvariablesResponse updateVariable(@RequestBody UD10HdocvariablesRequest request) {
        return ud10Service.UD10Update(request);
    }

    @PostMapping("/delete")
    @ApiOperation(value = "删除变量", notes = "根据变量名删除HDOC_VARIABLES表中的变量")
    public UD10HdocvariablesResponse deleteVariable(@RequestBody UD10HdocvariablesRequest request) {
        return ud10Service.UD10Delete(request);
    }
}
