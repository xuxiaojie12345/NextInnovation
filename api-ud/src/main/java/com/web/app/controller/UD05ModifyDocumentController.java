package com.web.app.controller;

import com.web.app.dto.UD05ModifyDocumentRequest;
import com.web.app.dto.UD05ModifyDocumentUpdateRequest;
import com.web.app.dto.UD05ModifyDocumentResponse;
import com.web.app.service.UD05ModifyDocumentService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * UD05 修改文档变量控制器
 *
 * 功能说明：提供画面初始展示查询与文档变量更新接口
 *
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-18
 */
@Slf4j
@RestController
@RequestMapping("/api/ud05")
@Api(tags = "UD05 - 修改文档变量")
public class UD05ModifyDocumentController {

    @Autowired
    private UD05ModifyDocumentService ud05Service;

    @GetMapping("/selectmodifydocument")
    @ApiOperation(value = "查询修改文档变量", notes = "根据底盘系列和底盘编号查询文档变量修改数据")
    public UD05ModifyDocumentResponse selectModifyDocument(
            @ApiParam(value = "底盘系列", required = true, example = "ABC12") @RequestParam("chassisSerie") String chassisSerie,
            @ApiParam(value = "底盘编号", required = true, example = "1234567890") @RequestParam("chassisNo") String chassisNo) {

        UD05ModifyDocumentRequest request = new UD05ModifyDocumentRequest(chassisSerie, chassisNo);
        UD05ModifyDocumentResponse response = ud05Service.UD05SelectVariableModification(request);

        return response;
    }

    @PostMapping("/updatemodifydocument")
    @ApiOperation(value = "更新修改文档变量", notes = "根据底盘系列、底盘编号、批量修改项更新文档变量")
    public UD05ModifyDocumentResponse updateModifyDocument(
            @RequestBody UD05ModifyDocumentUpdateRequest request) {

        UD05ModifyDocumentResponse response = ud05Service.UD05UpdateHdocAdcaModification(request);

        return response;
    }
}
