package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.DocumentTypeDto;
import com.web.app.service.UD03SelectHdocdocumentlistService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * UD03 Controller - 提供 Document type 下拉列表数据
 */
@Api(tags = "UD03 - Document List")
@RestController
@RequestMapping("/api/ud03")
public class UD03SelectHdocdocumentlistController {

    @Autowired
    private UD03SelectHdocdocumentlistService ud03Service;

    @ApiOperation(value = "获取HDOC文档类型列表", notes = "返回 HDOC_DOCUMENT_LIST 表的 DOCTYPE 列表供前端下拉使用")
    @GetMapping({ "/select-hdoc-document-list", "/selecthdocdocumentlist" })
    public ApiResponse<List<DocumentTypeDto>> selectHdocDocumentList() {
        List<DocumentTypeDto> list = ud03Service.getDocumentTypes();
        return ApiResponse.success(list);
    }
}
