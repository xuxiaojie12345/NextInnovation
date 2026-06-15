package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD09DeleteUserDefinedRulesRequest;
import com.web.app.domain.UD09SearchUserDefinedRulesRequest;
import com.web.app.service.UD09DeleteHdocuserdefinedrulesService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * UD09 Delete HDOC User Defined Rules Controller
 * 提供用户定义规则的搜索与删除功能
 */
@Slf4j
@RestController
@RequestMapping("/api/ud09DeleteHdocuserdefinedrules")
@CrossOrigin(
    origins = "*",
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class UD09DeleteHdocuserdefinedrulesController {

    @Autowired
    private UD09DeleteHdocuserdefinedrulesService ud09DeleteHdocuserdefinedrulesService;

    /**
     * 4.1~4.2 搜索用户定义规则
     * 客户端通过POST请求将搜索条件以JSON格式发送至后端
     *
     * @param request 搜索请求参数（产品类别、编号、市场、变量、值、变体字符串1/2、备注、Add、Delete、创建用户、日期）
     * @return API响应，包含搜索到的用户定义规则列表
     */
    @PostMapping("/search")
    public ResponseEntity<ApiResponse<?>> searchUserDefinedRules(
            @RequestBody UD09SearchUserDefinedRulesRequest request) {

        log.info("========== UD09 Controller: Search User Defined Rules ==========");
        log.info("Search params - PC: {}, NUM: {}, MARKET: {}",
                request.getProductClass(), request.getNumber(), request.getMarket());

        // 4.3 调用Service层处理搜索逻辑
        ApiResponse<?> response = ud09DeleteHdocuserdefinedrulesService.searchUserDefinedRules(request);

        log.info("Response code: {}, msg: {}, data size: {}",
                response.getCode(), response.getMsg(),
                response.getData() instanceof List ? ((List<?>) response.getData()).size() : "N/A");
        log.info("========== UD09 Controller: Search completed ==========");

        return ResponseEntity.ok(response);
    }

    /**
     * 4.1~4.2 批量删除用户定义规则
     * 客户端通过DELETE请求将主键列表以JSON格式发送至后端
     *
     * @param deleteRequests 删除请求列表（包含产品类别、编号、市场主键）
     * @return API响应，包含删除结果统计
     */
    @PostMapping("/deleteSelected")
    public ResponseEntity<ApiResponse<?>> deleteSelectedUserDefinedRules(
            @RequestBody List<UD09DeleteUserDefinedRulesRequest> deleteRequests) {

        log.info("========== UD09 Controller: Delete Selected User Defined Rules ==========");
        log.info("Delete requests count: {}", deleteRequests != null ? deleteRequests.size() : 0);

        if (deleteRequests == null || deleteRequests.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.error(400, "删除请求参数不能为空"));
        }

        // 调用Service层处理删除逻辑
        ApiResponse<?> response = ud09DeleteHdocuserdefinedrulesService.deleteSelectedUserDefinedRules(deleteRequests);

        log.info("Response code: {}, msg: {}", response.getCode(), response.getMsg());
        log.info("========== UD09 Controller: Delete completed ==========");

        return ResponseEntity.ok(response);
    }
}
