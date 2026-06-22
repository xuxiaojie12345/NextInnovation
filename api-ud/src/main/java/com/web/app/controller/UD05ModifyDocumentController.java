package com.web.app.controller;

import com.web.app.dto.UD05ModifyDocumentRequest;
import com.web.app.dto.UD05ModifyDocumentResponse;
import com.web.app.dto.UD05UpdateRequest;
import com.web.app.service.UD05ModifyDocumentService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD05 - Modify Document API控制器
 */
@RestController
@RequestMapping("/api/UD05ModifyDocumentApi")
@Api(tags = "UD05-Modify Document API")
public class UD05ModifyDocumentController {

    @Autowired
    private UD05ModifyDocumentService ud05ModifyDocumentService;

    @PostMapping("/UD05SelectVariableModification")
    @ApiOperation("查询变量修改信息")
    public UD05ModifyDocumentResponse selectVariableModification(@RequestBody UD05ModifyDocumentRequest request) {
        UD05ModifyDocumentResponse newResponse = new UD05ModifyDocumentResponse();
        newResponse = ud05ModifyDocumentService.selectVariableModification(request);
        return newResponse;
    }

    @PostMapping("/UD05UpdateHdocAdcaModification")
    @ApiOperation("批量更新变量修改信息")
    public UD05ModifyDocumentResponse updateHdocAdcaModification(@RequestBody UD05UpdateRequest request) {
        return ud05ModifyDocumentService.updateHdocAdcaModification(request);
    }
}
