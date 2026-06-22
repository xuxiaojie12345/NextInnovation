package com.web.app.controller;

import com.web.app.dto.UD09DeleteHdocuserdefinedrulesRequest;
import com.web.app.dto.UD09DeleteHdocuserdefinedrulesResponse;
import com.web.app.service.UD09DeleteHdocuserdefinedrulesService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD09 - 删除用户定义规则API控制器
 */
@RestController
@RequestMapping("/api/UD09DeleteHdocuserdefinedrulesApi")
@Api(tags = "UD09-删除用户定义规则API")
public class UD09DeleteHdocuserdefinedrulesController {

    @Autowired
    private UD09DeleteHdocuserdefinedrulesService ud09DeleteHdocuserdefinedrulesService;

    @PostMapping("/UD09Seach")
    @ApiOperation("搜索用户定义规则")
    public UD09DeleteHdocuserdefinedrulesResponse search(@RequestBody UD09DeleteHdocuserdefinedrulesRequest request) {
        return ud09DeleteHdocuserdefinedrulesService.searchRules(request);
    }

    @PostMapping("/UD09DeleteSelected")
    @ApiOperation("删除选中的记录")
    public UD09DeleteHdocuserdefinedrulesResponse deleteSelected(@RequestBody UD09DeleteHdocuserdefinedrulesRequest request) {
        return ud09DeleteHdocuserdefinedrulesService.deleteSelected(request);
    }
}
