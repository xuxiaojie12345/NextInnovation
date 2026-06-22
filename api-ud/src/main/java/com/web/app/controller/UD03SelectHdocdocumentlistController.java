package com.web.app.controller;

import com.web.app.dto.UD03SelectHdocdocumentlistResponse;
import com.web.app.service.UD03SelectHdocdocumentlistService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * UD03 文档类型列表控制器
 * 
 * 功能说明：提供获取文档类型列表的REST API接口
 * 
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-18
 */
@Slf4j
@RestController
@RequestMapping("/api/ud03")
@Api(tags = "UD03 - 获取文档类型列表")
public class UD03SelectHdocdocumentlistController {

    @Autowired
    private UD03SelectHdocdocumentlistService ud03Service;

    /**
     * 获取文档类型列表
     * 对应设计文档 4.1 - 客户端通过GET请求访问接口 /api/ud03/gethdocdocumentlist
     * 
     * 接口说明：
     * - Method: GET
     * - Endpoint: /api/ud03/gethdocdocumentlist
     * - 参数: 无
     * - 返回: 文档类型列表（按DOCTYPE排序）
     * 
     * 处理流程：
     * 1. 接收前端GET请求
     * 2. 调用Service层获取文档类型列表
     * 3. 返回标准响应格式
     * 
     * @return UD03SelectHdocdocumentlistResponse 响应对象
     */
    @GetMapping("/gethdocdocumentlist")
    @ApiOperation(value = "获取文档类型列表", notes = "从 HDOC_DOCUMENT_LIST 表中查询所有文档类型，按 DOCTYPE 排序")
    public UD03SelectHdocdocumentlistResponse getHdocDocumentList() {
        log.info("收到获取文档类型列表的请求");

        // 4.3 调用Service层处理业务逻辑
        UD03SelectHdocdocumentlistResponse response = ud03Service.getHdocDocumentList();

        log.info("返回响应，code: {}", response.getCode());

        return response;
    }
}
