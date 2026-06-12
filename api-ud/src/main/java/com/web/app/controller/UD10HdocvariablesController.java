package com.web.app.controller;

import com.web.app.dto.CommonResponse;
import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.entity.HdocVariables;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD10 HDoc变量API控制器
 */
@RestController
@RequestMapping("/api/UD10HdocvariablesApi")
@Api(tags = "UD10-HDoc变量API")
public class UD10HdocvariablesController {
    
    @Autowired
    private HdocVariablesMapper hdocVariablesMapper;
    
    @PostMapping("/UD10Add")
    @ApiOperation("新增HDoc变量")
    public CommonResponse add(@RequestBody HdocVariables variables) {
        // 检查变量是否已存在
        int count = hdocVariablesMapper.countByVariable(variables.getVariable());
        if (count > 0) {
            return CommonResponse.error("Variant already exists. Please enter the correct content");
        }
        
        int result = hdocVariablesMapper.insert(variables);
        if (result > 0) {
            return CommonResponse.success("登录成功", null);
        } else {
            return CommonResponse.error("登录失败");
        }
    }
    
    @PostMapping("/UD10Update")
    @ApiOperation("更新HDoc变量")
    public CommonResponse update(@RequestBody HdocVariables variables) {
        // 检查变量是否存在
        int count = hdocVariablesMapper.countByVariable(variables.getVariable());
        if (count == 0) {
            return CommonResponse.error("Variant does not exists. Please enter the correct content");
        }
        
        int result = hdocVariablesMapper.update(variables);
        if (result > 0) {
            return CommonResponse.success("更新成功", null);
        } else {
            return CommonResponse.error("更新失败");
        }
    }
    
    @PostMapping("/UD10Delete")
    @ApiOperation("删除HDoc变量")
    public CommonResponse delete(@RequestBody Map<String, String> params) {
        String variable = params.get("variable");
        
        // 检查变量是否存在
        int count = hdocVariablesMapper.countByVariable(variable);
        if (count == 0) {
            return CommonResponse.error("Variant does not exists. Please enter the correct content");
        }
        
        int result = hdocVariablesMapper.deleteByVariable(variable);
        if (result > 0) {
            return CommonResponse.success("删除成功", null);
        } else {
            return CommonResponse.error("删除失败");
        }
    }
}
