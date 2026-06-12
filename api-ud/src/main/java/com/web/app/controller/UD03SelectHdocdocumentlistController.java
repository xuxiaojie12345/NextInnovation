package com.web.app.controller;

import com.web.app.dto.CommonResponse;
import com.web.app.entity.HdocDocumentList;
import com.web.app.mapper.HdocDocumentListMapper;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD03 文档类型查询API控制器
 */
@RestController
@RequestMapping("/api/UD03SelectHdocdocumentlistApi")
@Api(tags = "UD03-文档类型查询API")
public class UD03SelectHdocdocumentlistController {
    
    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;
    
    @PostMapping("/types")
    @ApiOperation("查询文档类型列表")
    public CommonResponse getDocumentTypes() {
        List<HdocDocumentList> documentTypes = hdocDocumentListMapper.selectAllDocumentTypes();
        
        Map<String, Object> data = new HashMap<>();
        data.put("documentTypes", documentTypes);
        
        return CommonResponse.success(data);
    }
}
