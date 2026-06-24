package com.web.app.controller;

import com.web.app.dto.UD08HomologationVariablesResponse;
import com.web.app.dto.UD08UserDefinedRulesRequest;
import com.web.app.service.UD08HomologationVariablesService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD08 - Homologation Variables API控制器
 */
@RestController
@RequestMapping("/api/UD08HomologationVariablesApi")
@Api(tags = "UD08-Homologation Variables API")
public class UD08HomologationVariablesController {

    @Autowired
    private UD08HomologationVariablesService ud08HomologationVariablesService;

    @GetMapping("/UD08SelectProductclassmaster")
    @ApiOperation("查询产品类别主数据")
    public UD08HomologationVariablesResponse selectProductclassmaster() {
        UD08HomologationVariablesResponse response = new UD08HomologationVariablesResponse();
        response = ud08HomologationVariablesService.selectProductclassmaster();
        return response;

    }

    @GetMapping("/UD08SelectMarketmaster")
    @ApiOperation("查询市场主数据")
    public UD08HomologationVariablesResponse selectMarketmaster() {
        return ud08HomologationVariablesService.selectMarketmaster();
    }

    @GetMapping("/UD08SelectHdocvariables")
    @ApiOperation("查询HDoc变量")
    public UD08HomologationVariablesResponse selectHdocvariables() {
        return ud08HomologationVariablesService.selectHdocvariables();
    }

    @PostMapping("/UD08Add")
    @ApiOperation("新增用户定义规则")
    public UD08HomologationVariablesResponse add(@RequestBody UD08UserDefinedRulesRequest request) {
        return ud08HomologationVariablesService.addUserDefinedRules(request);
    }

    @PostMapping("/UD08Update")
    @ApiOperation("更新用户定义规则")
    public UD08HomologationVariablesResponse update(@RequestBody UD08UserDefinedRulesRequest request) {
        return ud08HomologationVariablesService.updateUserDefinedRules(request);
    }

    @PostMapping("/UD08Delete")
    @ApiOperation("删除用户定义规则")
    public UD08HomologationVariablesResponse delete(@RequestBody UD08UserDefinedRulesRequest request) {
        return ud08HomologationVariablesService.deleteUserDefinedRules(request);
    }
}
