package com.web.app.service;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD09DeleteUserDefinedRulesRequest;
import com.web.app.domain.UD09SearchUserDefinedRulesRequest;

import java.util.List;

/**
 * UD09 Delete HDOC User Defined Rules Service
 * 提供用户定义规则的搜索与删除业务逻辑
 */
public interface UD09DeleteHdocuserdefinedrulesService {

    /**
     * 搜索用户定义规则
     *
     * @param request 搜索请求参数
     * @return API响应，包含用户定义规则列表
     */
    ApiResponse<?> searchUserDefinedRules(UD09SearchUserDefinedRulesRequest request);

    /**
     * 批量删除用户定义规则
     *
     * @param deleteRequests 删除请求列表
     * @return API响应，包含删除结果统计
     */
    ApiResponse<?> deleteSelectedUserDefinedRules(List<UD09DeleteUserDefinedRulesRequest> deleteRequests);
}
