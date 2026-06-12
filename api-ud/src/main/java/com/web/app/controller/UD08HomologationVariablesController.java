package com.web.app.controller;

import com.web.app.dto.CommonResponse;
import com.web.app.mapper.ProductClassMasterMapper;
import com.web.app.mapper.MarketMasterMapper;
import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.entity.ProductClassMaster;
import com.web.app.entity.MarketMaster;
import com.web.app.entity.HdocVariables;
import com.web.app.entity.HdocUserDefinedRules;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD08 同源变量API控制器
 */
@RestController
@RequestMapping("/api/UD08HomologationVariablesApi")
@Api(tags = "UD08-同源变量API")
public class UD08HomologationVariablesController {
    
    @Autowired
    private ProductClassMasterMapper productClassMasterMapper;
    
    @Autowired
    private MarketMasterMapper marketMasterMapper;
    
    @Autowired
    private HdocVariablesMapper hdocVariablesMapper;
    
    @Autowired
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;
    
    @GetMapping("/UD08SelectProductclassmaster")
    @ApiOperation("查询产品类别主数据")
    public CommonResponse selectProductClassMaster() {
        List<ProductClassMaster> list = productClassMasterMapper.selectAll();
        return CommonResponse.success(list);
    }
    
    @GetMapping("/UD08SelectMarketmaster")
    @ApiOperation("查询市场主数据")
    public CommonResponse selectMarketMaster() {
        List<MarketMaster> list = marketMasterMapper.selectAll();
        return CommonResponse.success(list);
    }
    
    @PostMapping("/UD08Add")
    @ApiOperation("新增用户定义规则")
    public CommonResponse add(@RequestBody HdocUserDefinedRules rules) {
        // 检查是否存在
        int count = hdocUserDefinedRulesMapper.countByCondition(rules.getPc(), rules.getNum(), rules.getMarket());
        if (count > 0) {
            return CommonResponse.error("记录已存在");
        }
        
        // 验证变量是否存在
        int varCount = hdocVariablesMapper.countByVariable(rules.getVariable());
        if (varCount == 0) {
            return CommonResponse.error("变量不存在");
        }
        
        int result = hdocUserDefinedRulesMapper.insert(rules);
        if (result > 0) {
            return CommonResponse.success("登录成功", null);
        } else {
            return CommonResponse.error("登录失败");
        }
    }
    
    @PostMapping("/UD08Update")
    @ApiOperation("更新用户定义规则")
    public CommonResponse update(@RequestBody HdocUserDefinedRules rules) {
        // 检查是否存在
        int count = hdocUserDefinedRulesMapper.countByCondition(rules.getPc(), rules.getNum(), rules.getMarket());
        if (count == 0) {
            return CommonResponse.error("记录不存在");
        }
        
        int result = hdocUserDefinedRulesMapper.update(rules);
        if (result > 0) {
            return CommonResponse.success("更新成功", null);
        } else {
            return CommonResponse.error("更新失败");
        }
    }
    
    @PostMapping("/UD08Delete")
    @ApiOperation("删除用户定义规则")
    public CommonResponse delete(@RequestBody Map<String, String> params) {
        String pc = params.get("pc");
        String num = params.get("num");
        String market = params.get("market");
        
        // 检查是否存在
        int count = hdocUserDefinedRulesMapper.countByCondition(pc, num, market);
        if (count == 0) {
            return CommonResponse.error("记录不存在");
        }
        
        int result = hdocUserDefinedRulesMapper.deleteByCondition(pc, num, market);
        if (result > 0) {
            return CommonResponse.success("删除成功", null);
        } else {
            return CommonResponse.error("删除失败");
        }
    }
}
