package com.web.app.controller;

import com.web.app.dto.UD11HdocvariablesRequest;
import com.web.app.dto.UD11HdocvariablesResponse;
import com.web.app.service.UD11HdocvariablesService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * UD11 HDOC变量搜索控制器
 *
 * 功能说明：提供HDOC变量的搜索查询接口
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@RestController
@RequestMapping("/api/ud11")
@Api(tags = "UD11 - HDOC变量搜索")
public class UD11HdocvariablesController {

    @Autowired
    private UD11HdocvariablesService ud11Service;

    @GetMapping("/search")
    @ApiOperation(value = "搜索HDOC变量", notes = "根据动态条件搜索HDOC_VARIABLES表中的变量")
    public UD11HdocvariablesResponse search(UD11HdocvariablesRequest request) {
        return ud11Service.searchVariables(request);
    }
}
