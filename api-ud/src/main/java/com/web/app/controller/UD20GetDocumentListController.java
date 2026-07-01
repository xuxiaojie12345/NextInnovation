package com.web.app.controller;

import com.web.app.dto.UD20GetDocumentListRequest;
import com.web.app.dto.UD20GetDocumentListResponse;
import com.web.app.service.UD20GetDocumentListService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * UD20 获取文档列表控制器
 *
 * 功能说明：提供文档列表查询的 REST API 接口
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-07-01
 */
@Slf4j
@RestController
@RequestMapping("/api/ud20")
@Api(tags = "UD20 - 获取文档列表")
public class UD20GetDocumentListController {

    @Autowired
    private UD20GetDocumentListService ud20Service;

    /**
     * 获取文档列表
     * 对应设计文档 4.1 - 客户端通过GET请求访问接口 /api/ud20/getdocumentlist
     *
     * 接口说明：
     * - Method: GET
     * - Endpoint: /api/ud20/getdocumentlist
     * - 参数: 可选（doctype, registerUser, registerDatetime）
     * - 返回: 文档列表（支持动态条件查询）
     *
     * 处理流程：
     * 1. 接收前端GET请求及可选参数
     * 2. 封装请求参数到 Request 对象
     * 3. 调用 Service 层查询文档列表
     * 4. 返回标准响应格式
     *
     * @param doctype          文档类型（可选，支持模糊查询）
     * @param registerUser     注册用户（可选）
     * @param registerDatetime 注册日期（可选，大于等于条件）
     * @return UD20GetDocumentListResponse 响应对象
     */
    @GetMapping("/getdocumentlist")
    @ApiOperation(value = "获取文档列表", notes = "从 HDOC_DOCUMENT_LIST 表中查询文档信息，支持按 doctype（模糊）、registerUser、registerDatetime 动态条件查询")
    public UD20GetDocumentListResponse getDocumentList(
            @ApiParam(value = "文档类型（支持模糊查询）", example = "Homologation") @RequestParam(value = "doctype", required = false) String doctype,
            @ApiParam(value = "注册用户", example = "john.doe") @RequestParam(value = "registerUser", required = false) String registerUser,
            @ApiParam(value = "注册日期（起始日期，大于等于条件）", example = "2026-01-01") @RequestParam(value = "registerDatetime", required = false) String registerDatetime) {
        log.info("收到UD20获取文档列表请求");

        // 4.2 封装请求参数
        UD20GetDocumentListRequest request = new UD20GetDocumentListRequest();
        request.setDoctype(doctype);
        request.setRegisterUser(registerUser);
        request.setRegisterDatetime(registerDatetime);

        // 4.3 调用Service层处理业务逻辑
        UD20GetDocumentListResponse response = ud20Service.getDocumentList(request);

        log.info("返回响应，code: {}, 数据条数: {}",
                response.getCode(),
                response.getData() != null ? response.getData().size() : 0);

        return response;
    }
}
