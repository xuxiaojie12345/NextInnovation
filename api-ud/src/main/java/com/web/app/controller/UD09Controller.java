package com.web.app.controller;

import com.web.app.domain.UD09BatchDeleteRequest;
import com.web.app.domain.UD09BatchDeleteResponse;
import com.web.app.domain.UD08SearchRequest;
import com.web.app.domain.ApiResponse;
import com.web.app.domain.entity.HdocUserDefinedRules;
import com.web.app.service.UD09Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * UD09控制器
 * 提供UD09DeleteHdocuserdefinedrulesApi接口 - 用户自定义规则批量删除
 * 对应详细设计：DES-HomologationVariablesResultListPage-001
 *
 * 接口列表：
 * 1. POST /api/ud09/deletehdocuserdefinedrules - 批量删除用户自定义规则
 */
@RestController
@RequestMapping("/api/ud09")
/**

 * UD09Controller

 */

public class UD09Controller {

    private static final Logger logger = LoggerFactory.getLogger(UD09Controller.class);

    @Autowired
    /** ud09Service */

    private UD09Service ud09Service;

    /**
     * UD09Search
     * 根据搜索条件查询用户自定义规则列表
     * POST /api/ud09/search
     */
    @PostMapping("/search")
    /**

     * search

     */

    public ApiResponse<List<HdocUserDefinedRules>> search(@RequestBody UD08SearchRequest request) {
        logger.info("UD09Search called");
        try {
            List<HdocUserDefinedRules> list = ud09Service.UD09Search(request);
            return ApiResponse.success(list);
        } catch (Exception e) {
            logger.error("UD09Search error", e);
            return ApiResponse.serverError();
        }
    }

    /**
     * UD09DeleteSelected
     * 批量删除用户自定义规则记录
     * POST /api/ud09/deletehdocuserdefinedrules
     */
    @PostMapping("/deletehdocuserdefinedrules")
    public ApiResponse<UD09BatchDeleteResponse> deleteSelected(
            @RequestBody List<UD09BatchDeleteRequest> requests) {

        logger.info("UD09DeleteSelected called - batch size: {}", requests.size());

        if (requests == null || requests.isEmpty()) {
            return ApiResponse.error(400, "No records to delete.");
        }

        try {
            UD09BatchDeleteResponse response = ud09Service.UD09DeleteSelected(requests);
            if (response.getFailedCount() > 0 && response.getDeletedCount() == 0) {
                return ApiResponse.error(500, response.getMessage());
            }
            return ApiResponse.success(response);
        } catch (Exception e) {
            logger.error("UD09DeleteSelected error", e);
            return ApiResponse.serverError();
        }
    }
}
