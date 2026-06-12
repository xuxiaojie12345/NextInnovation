package com.web.app.controller;

import com.web.app.dto.CommonResponse;
import com.web.app.mapper.HdocDocumentListMapper;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD20 市场文档设置API控制器
 */
@RestController
@RequestMapping("/api/UD20MarketDocumentSettingsApi")
@Api(tags = "UD20-市场文档设置API")
public class UD20MarketDocumentSettingsController {
    
    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;
    
    @GetMapping("/document-list")
    @ApiOperation("获取文档列表")
    public CommonResponse getDocumentList(@RequestParam(required = false) String documentType) {
        List<Map<String, Object>> documents = hdocDocumentListMapper.selectByDocumentType(documentType)
            .stream()
            .map(doc -> {
                Map<String, Object> map = new HashMap<>();
                map.put("doctype", doc.getDoctype());
                map.put("description", doc.getDescription());
                map.put("registerUser", doc.getRegisterUser());
                map.put("registerDatetime", doc.getRegisterDatetime());
                return map;
            })
            .collect(java.util.stream.Collectors.toList());
        
        Map<String, Object> data = new HashMap<>();
        data.put("documents", documents);
        
        return CommonResponse.success(data);
    }
    
    // @PostMapping("/update")
    // @ApiOperation("更新文档设置")
    // public CommonResponse update(@RequestBody Map<String, String> params) {
    //     String documentType = params.get("documentType");
    //     String user = params.get("user");
    //     String date = params.get("date");
        
    //     // 检查文档是否存在
    //     List<Map<String, Object>> docs = hdocDocumentListMapper.selectByDocumentType(documentType);
    //     if (docs == null || docs.isEmpty()) {
    //         return CommonResponse.error("No data found");
    //     }
        
    //     // 这里简化处理，实际需要更新具体字段
    //     return CommonResponse.success("更新成功", null);
    // }
}
