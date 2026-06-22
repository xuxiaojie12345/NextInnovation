package com.web.app.controller;

import com.web.app.dto.SelectGeneratedocumentRequest;
import com.web.app.dto.SelectGeneratedocumentResponse;
import com.web.app.service.SelectGeneratedocumentService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD04 - Generate document查询API控制器
 */
@RestController
@RequestMapping("/api/UD04SelectGeneratedocumentApi")
@Api(tags = "UD04-Generate document查询API")
public class UD04SelectGeneratedocumentController {

    @Autowired
    private SelectGeneratedocumentService selectGeneratedocumentService;

    @PostMapping("/SelectGeneratedocument")
    @ApiOperation("查询Generate document信息")
    public SelectGeneratedocumentResponse selectGeneratedocument(@RequestBody SelectGeneratedocumentRequest request) {
        return selectGeneratedocumentService.selectGeneratedocument(request);
    }
}
