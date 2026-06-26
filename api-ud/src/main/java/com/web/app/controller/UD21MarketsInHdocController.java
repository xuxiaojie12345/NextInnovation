package com.web.app.controller;

import com.web.app.entity.MarketMaster;
import com.web.app.mapper.MarketMasterMapper;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD21 - Markets in Hdoc API控制器
 */
@RestController
@RequestMapping("/api/UD21MarketsInHdocApi")
@Api(tags = "UD21-Markets in Hdoc API")
public class UD21MarketsInHdocController {

    @Autowired
    private MarketMasterMapper marketMasterMapper;

    @GetMapping("/markets")
    @ApiOperation("获取市场列表")
    public Map<String, Object> getMarkets() {
        Map<String, Object> result = new HashMap<>();
        try {
            List<MarketMaster> markets = marketMasterMapper.selectAll();
            result.put("code", 200);
            result.put("msg", "查询成功");
            result.put("data", markets);
        } catch (Exception e) {
            result.put("code", 500);
            result.put("msg", "无法加载市场列表，请稍后重试");
            result.put("data", null);
        }
        return result;
    }
}
