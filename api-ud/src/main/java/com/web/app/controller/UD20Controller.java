package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.service.UD20Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * UD20 Controller
 * 提供文档类型列表的API接口
 */
@Slf4j
@RestController
@RequestMapping("/api/ud20")
@CrossOrigin(
    origins = "*",
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class UD20Controller {

    @Autowired
    private UD20Service ud20Service;

    /**
     * 获取文档类型列表
     * GET /api/ud20/getdocumentlist
     *
     * 4.1 客户端通过GET请求访问接口 /api/ud20/getdocumentlist，无需请求参数
     * 4.2 后端接收前端请求，调用HdocDocumentService接口中的 getDocumentList() 方法
     */
    @GetMapping("/getdocumentlist")
    public ResponseEntity<ApiResponse<?>> getDocumentList() {
        log.info("========== UD20 Controller: Get Document List ==========");

        // 4.2-4.3 控制器层调用Service接口中的 getDocumentList() 方法
        ApiResponse<?> response = ud20Service.getDocumentList();

        log.info("Response code: {}, msg: {}", response.getCode(), response.getMsg());
        log.info("========== UD20 Controller: Get Document List completed ==========");

        // 4.8 封装响应对象，统一返回标准格式
        return ResponseEntity.ok(response);
    }
}
