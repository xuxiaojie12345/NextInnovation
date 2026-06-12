package com.web.app.controller;

import com.web.app.dto.CommonResponse;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.entity.HdocUserDefinedRules;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD09 删除用户定义规则API控制器
 */
@RestController
@RequestMapping("/api/UD09DeleteHdocuserdefinedrulesApi")
@Api(tags = "UD09-删除用户定义规则API")
public class UD09DeleteHdocuserdefinedrulesController {
    
    @Autowired
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;
    
    @PostMapping("/UD09Seach")
    @ApiOperation("搜索用户定义规则")
    public CommonResponse search(@RequestBody HdocUserDefinedRules rules) {
        List<HdocUserDefinedRules> records = hdocUserDefinedRulesMapper.searchRules(rules);
        
        Map<String, Object> data = new HashMap<>();
        data.put("records", records);
        data.put("count", records.size());
        
        return CommonResponse.success(data);
    }
    
    @PostMapping("/UD09DeleteSelected")
    @ApiOperation("删除选中的记录")
    public CommonResponse deleteSelected(@RequestBody Map<String, Object> params) {
        @SuppressWarnings("unchecked")
        List<Map<String, String>> selectedRecords = (List<Map<String, String>>) params.get("selectedRecords");
        
        if (selectedRecords == null || selectedRecords.isEmpty()) {
            return CommonResponse.error("请至少选择一条记录");
        }
        
        int deleteCount = 0;
        for (Map<String, String> record : selectedRecords) {
            String pc = record.get("pc");
            String num = record.get("num");
            String market = record.get("market");
            
            int result = hdocUserDefinedRulesMapper.deleteByCondition(pc, num, market);
            if (result > 0) {
                deleteCount++;
            }
        }
        
        return CommonResponse.success("记录删除成功", null);
    }
}
