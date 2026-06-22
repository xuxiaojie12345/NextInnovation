package com.web.app.controller;

import com.web.app.dto.CommonResponse;
import com.web.app.service.SelectHdocdocumentlistService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD03 文档类型查询API控制器
 */
@RestController
@RequestMapping("/api/UD03SelectHdocdocumentlistApi")
@Api(tags = "UD03-文档类型查询API")
public class UD03SelectHdocdocumentlistController {
    
    @Autowired
    private SelectHdocdocumentlistService selectHdocdocumentlistService;
    
    @GetMapping("/types")
    @ApiOperation("查询文档类型列表")
    public CommonResponse getDocumentTypes() {
        return selectHdocdocumentlistService.selectHdocdocumentlist();
    }
}
