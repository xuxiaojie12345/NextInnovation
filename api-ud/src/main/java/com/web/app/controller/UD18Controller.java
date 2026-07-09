package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocDocumentList;
import com.web.app.service.UD18Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * UD18 Controller
 * 提供HDoc用户文档权限管理的API接口
 */
@Slf4j
@RestController
@RequestMapping("/api/ud18HDocUserDocAdministration")
@CrossOrigin(
    origins = "*",
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class UD18Controller {

    @Autowired
    private UD18Service ud18Service;

    /**
     * 获取文档列表
     * GET /api/ud18HDocUserDocAdministration/getDocumentList
     */
    @GetMapping("/getDocumentList")
    public ResponseEntity<ApiResponse<?>> getDocumentList() {

        ApiResponse<?> response = ud18Service.getDocumentList();

        return ResponseEntity.ok(response);
    }

    /**
     * 获取用户功能和文档权限
     * POST /api/ud18HDocUserDocAdministration/getUserFunctionsAndDocuments
     */
    @PostMapping("/getUserFunctionsAndDocuments")
    public ResponseEntity<ApiResponse<?>> getUserFunctionsAndDocuments(@RequestBody HdocDocumentList request) {

        ApiResponse<?> response = ud18Service.getUserFunctionsAndDocuments(request);

        return ResponseEntity.ok(response);
    }

    /**
     * 更新用户文档权限
     * POST /api/ud18HDocUserDocAdministration/updateUserDocuments
     */
    @PostMapping("/updateUserDocuments")
    public ResponseEntity<ApiResponse<?>> updateUserDocuments(@RequestBody HdocDocumentList request) {

        ApiResponse<?> response = ud18Service.updateUserDocuments(request);

        return ResponseEntity.ok(response);
    }
}
