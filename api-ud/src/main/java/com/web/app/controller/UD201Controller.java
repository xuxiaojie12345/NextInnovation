package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD201Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * UD20-1 Controller
 * 提供文档类型更新的API接口
 */
@Slf4j
@RestController
@RequestMapping("/api/ud20-1")
@CrossOrigin(
    origins = "*",
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class UD201Controller {

    @Autowired
    private UD201Service ud201Service;

    /**
     * 更新HDOC_DOCUMENT_LIST表数据
     * POST /api/ud20-1/updatehdocdocumentlist
     *
     * Request Body:
     * {
     *   "operation": "UPDATE_HDOC_DOCUMENT_LIST",
     *   "doctype": "string",
     *   "user": "string",
     *   "date": "string"
     * }
     */
    @PostMapping("/updatehdocdocumentlist")
    public ResponseEntity<ApiResponse<?>> updateHdocDocumentList(@RequestBody Map<String, String> request) {

        String doctype = request.get("doctype");
        String user = request.get("user");
        String date = request.get("date");

        // 校验doctype是否为空
        if (doctype == null || doctype.trim().isEmpty()) {
            return ResponseEntity.ok(ApiResponse.error(400, "Document type不能为空"));
        }

        ApiResponse<?> response = ud201Service.updateHdocDocumentList(doctype, user, date);

        return ResponseEntity.ok(response);
    }
}
