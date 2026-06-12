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
 * UD11 HDoc变量搜索API控制器
 */
@RestController
@RequestMapping("/api/UD11HdocvariablesApi")
@Api(tags = "UD11-HDoc变量搜索API")
public class UD11HdocvariablesController {
    
    @Autowired
    private HdocVariablesMapper hdocVariablesMapper;
    
    @PostMapping("/UD11Search")
    @ApiOperation("搜索HDoc变量")
    public CommonResponse search(@RequestBody HdocVariables variables) {
        List<HdocVariables> result = hdocVariablesMapper.searchVariables(variables);
        
        Map<String, Object> data = new HashMap<>();
        data.put("variables", result);
        data.put("count", result.size());
        
        return CommonResponse.success(data);
    }
}
