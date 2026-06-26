package com.web.app.controller;

import com.web.app.dto.UD201UpdateHdocDocumentRequest;
import com.web.app.dto.UD201UpdateHdocDocumentResponse;
import com.web.app.service.UD201UpdateHdocDocumentService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD20-1 更新文档列表控制器
 *
 * 功能说明：提供文档更新接口
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@RestController
@RequestMapping("/api/ud201")
@Api(tags = "UD20-1 - 更新文档列表")
public class UD201UpdateHdocDocumentController {

    @Autowired
    private UD201UpdateHdocDocumentService ud201Service;

    @PutMapping("/updatedocument")
    @ApiOperation(value = "更新文档列表", notes = "更新HDOC_DOCUMENT_LIST表中的文档信息")
    public UD201UpdateHdocDocumentResponse updateDocument(@RequestBody UD201UpdateHdocDocumentRequest request) {
        log.info("收到UD20-1更新文档列表请求, doctype: {}", request.getDoctype());
        return ud201Service.updateDocumentList(request);
    }
}
