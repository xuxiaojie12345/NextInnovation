package com.web.app.controller;

import com.web.app.dto.UD09DeleteHdocuserdefinedrulesRequest;
import com.web.app.dto.UD09DeleteHdocuserdefinedrulesResponse;
import com.web.app.service.UD09DeleteHdocuserdefinedrulesService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD09 删除用户定义规则控制器
 *
 * 功能说明：提供用户定义规则的搜索和批量删除接口
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@RestController
@RequestMapping("/api/ud09")
@Api(tags = "UD09 - 删除用户定义规则")
public class UD09DeleteHdocuserdefinedrulesController {

    @Autowired
    private UD09DeleteHdocuserdefinedrulesService ud09Service;

    @GetMapping("/seach")
    @ApiOperation(value = "搜索用户定义规则", notes = "根据动态条件搜索HDOC_USER_DEFINED_RULES表中的规则")
    public UD09DeleteHdocuserdefinedrulesResponse search(
            UD09DeleteHdocuserdefinedrulesRequest request) {
        return ud09Service.UD09Seach(request);
    }

    @PostMapping("/deleteselected")
    @ApiOperation(value = "删除选中的规则", notes = "根据PC、NUM、MARKET删除HDOC_USER_DEFINED_RULES表中的规则")
    public UD09DeleteHdocuserdefinedrulesResponse deleteSelected(
            @RequestBody UD09DeleteHdocuserdefinedrulesRequest request) {
        return ud09Service.UD09DeleteSelected(request);
    }
}
