package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocVariables;
import com.web.app.service.UD10HdocVariablesService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * UD10 Hdoc Variables Controller
 * 提供HDOC变量的添加、更新、删除API接口
 */
@Slf4j
@RestController
@RequestMapping("/api/ud10Hdocvariables")
@CrossOrigin(
    origins = "*",
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class UD10HdocVariablesController {

    @Autowired
    private UD10HdocVariablesService ud10HdocVariablesService;

    /**
     * 4.1~4.2 添加变量
     * 客户端通过POST请求将Variable请求参数，以JSON格式发送至后端服务
     *
     * @param request 变量信息（variable, type, description, createdByUser）
     * @return API响应
     */
    @PostMapping("/add")
    public ResponseEntity<ApiResponse<?>> addVariable(@RequestBody HdocVariables request) {

        // 4.3 调用Service层处理添加逻辑
        ApiResponse<?> response = ud10HdocVariablesService.addVariable(request);

        return ResponseEntity.ok(response);
    }

    /**
     * 4.1~4.2 更新变量
     * 客户端通过PUT请求将Variable请求参数，以JSON格式发送至后端服务
     *
     * @param request 变量信息（variable, type, description, createdByUser）
     * @return API响应
     */
    @PutMapping("/update")
    public ResponseEntity<ApiResponse<?>> updateVariable(@RequestBody HdocVariables request) {
        // 4.3 调用Service层处理更新逻辑
        ApiResponse<?> response = ud10HdocVariablesService.updateVariable(request);

        return ResponseEntity.ok(response);
    }

    /**
     * 4.1~4.2 删除变量
     * 客户端通过DELETE请求将Variable参数，以JSON格式发送至后端服务
     *
     * @param request 变量信息（variable）
     * @return API响应
     */
    @DeleteMapping("/delete")
    public ResponseEntity<ApiResponse<?>> deleteVariable(@RequestBody HdocVariables request) {
        // 4.3 调用Service层处理删除逻辑
        ApiResponse<?> response = ud10HdocVariablesService.deleteVariable(request);

        return ResponseEntity.ok(response);
    }

    /**
     * UD11: 搜索变量
     * 客户端通过POST请求将搜索条件以JSON格式发送至后端服务
     *
     * @param request 搜索条件（variable, type, description, createdByUser, date）
     * @return API响应，包含变量列表
     */
    @PostMapping("/search")
    public ResponseEntity<ApiResponse<?>> searchVariables(@RequestBody HdocVariables request) {
        // 4.3 调用Service层处理搜索逻辑
        ApiResponse<?> response = ud10HdocVariablesService.searchVariables(request);

        return ResponseEntity.ok(response);
    }
}
