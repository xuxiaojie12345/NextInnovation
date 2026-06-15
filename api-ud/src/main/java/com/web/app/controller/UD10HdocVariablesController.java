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
        log.info("========== UD10 Controller: Add Variable ==========");
        log.info("Add request - variable: {}", request.getVariable());

        // 4.3 调用Service层处理添加逻辑
        ApiResponse<?> response = ud10HdocVariablesService.addVariable(request);

        log.info("Response code: {}, msg: {}", response.getCode(), response.getMsg());
        log.info("========== UD10 Controller: Add completed ==========");

        return ResponseEntity.ok(response);
    }

    /**
     * 4.1~4.2 更新变量
     * 客户端通过PUT请求将Variable请求参数，以JSON格式发送至后端服务
     *
     * @param request 变量信息（variable, type, description, createdByUser）
     * @return API响应
     */
    @PostMapping("/update")
    public ResponseEntity<ApiResponse<?>> updateVariable(@RequestBody HdocVariables request) {
        log.info("========== UD10 Controller: Update Variable ==========");
        log.info("Update request - variable: {}", request.getVariable());

        // 4.3 调用Service层处理更新逻辑
        ApiResponse<?> response = ud10HdocVariablesService.updateVariable(request);

        log.info("Response code: {}, msg: {}", response.getCode(), response.getMsg());
        log.info("========== UD10 Controller: Update completed ==========");

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
        log.info("========== UD10 Controller: Delete Variable ==========");
        log.info("Delete request - variable: {}", request.getVariable());

        // 4.3 调用Service层处理删除逻辑
        ApiResponse<?> response = ud10HdocVariablesService.deleteVariable(request);

        log.info("Response code: {}, msg: {}", response.getCode(), response.getMsg());
        log.info("========== UD10 Controller: Delete completed ==========");

        return ResponseEntity.ok(response);
    }
}
