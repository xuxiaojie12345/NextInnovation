package com.web.app.controller;

import com.web.app.dto.UD08HomologationVariablesRequest;
import com.web.app.dto.UD08HomologationVariablesResponse;
import com.web.app.service.UD08HomologationVariablesService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD08 认证变量规则控制器
 *
 * 功能说明：提供认证变量规则的查询、新增、更新、删除接口
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@RestController
@RequestMapping("/api/ud08")
@Api(tags = "UD08 - 认证变量规则")
public class UD08HomologationVariablesController {

    @Autowired
    private UD08HomologationVariablesService ud08Service;

    @GetMapping("/selectproductclassmaster")
    @ApiOperation(value = "获取产品类别列表", notes = "查询所有产品类别PC列表")
    public UD08HomologationVariablesResponse selectProductClassMaster() {
        return ud08Service.UD08SelectProductclassmaster();
    }

    @GetMapping("/selectmarketmaster")
    @ApiOperation(value = "获取市场列表", notes = "查询所有市场MARKET列表")
    public UD08HomologationVariablesResponse selectMarketMaster() {
        return ud08Service.UD08SelectMarketmaster();
    }

    @GetMapping("/selecthdocvariables")
    @ApiOperation(value = "检查HDOC变量是否存在", notes = "根据变量名检查HDOC_VARIABLES表中是否存在该变量")
    public UD08HomologationVariablesResponse selectHdocVariables(
            @ApiParam(value = "变量名", required = true, example = "VAR001") @RequestParam("variables") String variables) {
        UD08HomologationVariablesRequest request = new UD08HomologationVariablesRequest();
        request.setVariables(variables);
        return ud08Service.UD08SelectHdocvariables(request);
    }

    @PostMapping("/add")
    @ApiOperation(value = "新增规则", notes = "向HDOC_USER_DEFINED_RULES表新增一条规则")
    public UD08HomologationVariablesResponse addRule(@RequestBody UD08HomologationVariablesRequest request) {
        return ud08Service.UD08Add(request);
    }

    @PostMapping("/update")
    @ApiOperation(value = "更新规则", notes = "更新HDOC_USER_DEFINED_RULES表中的规则数据")
    public UD08HomologationVariablesResponse updateRule(@RequestBody UD08HomologationVariablesRequest request) {
        return ud08Service.UD08Update(request);
    }

    @PostMapping("/delete")
    @ApiOperation(value = "删除规则", notes = "根据PC、NUM、MARKET删除HDOC_USER_DEFINED_RULES表中的规则")
    public UD08HomologationVariablesResponse deleteRule(@RequestBody UD08HomologationVariablesRequest request) {
        return ud08Service.UD08Delete(request);
    }
}
