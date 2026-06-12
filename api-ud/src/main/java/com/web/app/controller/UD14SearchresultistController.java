package com.web.app.controller;

import com.web.app.dto.CommonResponse;
import com.web.app.mapper.MarketMasterMapper;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD14 搜索结果列表API控制器
 */
@RestController
@RequestMapping("/api/UD14SearchresultistApi")
@Api(tags = "UD14-搜索结果列表API")
public class UD14SearchresultistController {
    
    @Autowired
    private MarketMasterMapper marketMasterMapper;
    
    @Autowired
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;
    
    @PostMapping("/UD14SelectMarketmaster")
    @ApiOperation("查询市场主数据")
    public CommonResponse selectMarketMaster() {
        List<Map<String, Object>> markets = marketMasterMapper.selectAll()
            .stream()
            .map(market -> {
                Map<String, Object> map = new HashMap<>();
                map.put("market", market.getMarket());
                return map;
            })
            .collect(java.util.stream.Collectors.toList());
        
        Map<String, Object> data = new HashMap<>();
        data.put("markets", markets);
        
        return CommonResponse.success(data);
    }
    
    @PostMapping("/UD14SelectHdocuserdefinedrules")
    @ApiOperation("根据市场查询用户定义规则")
    public CommonResponse selectHdocUserDefinedRules(@RequestBody Map<String, String> params) {
        String market = params.get("market");
        
        List<String> rules = hdocUserDefinedRulesMapper.selectVariablesByMarket(market);
        
        Map<String, Object> data = new HashMap<>();
        data.put("rules", rules);
        
        return CommonResponse.success(data);
    }
}
