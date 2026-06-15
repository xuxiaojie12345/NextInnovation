package com.web.app.service;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocVariables;

/**
 * UD10 Hdoc Variables Service
 * 提供HDOC变量的添加、更新、删除、搜索业务逻辑
 */
public interface UD10HdocVariablesService {

    /**
     * 添加变量
     *
     * @param request 变量信息（variable, type, description, createdByUser）
     * @return API响应
     */
    ApiResponse<?> addVariable(HdocVariables request);

    /**
     * 更新变量
     *
     * @param request 变量信息（variable, type, description, createdByUser）
     * @return API响应
     */
    ApiResponse<?> updateVariable(HdocVariables request);

    /**
     * 删除变量
     *
     * @param request 变量信息（variable）
     * @return API响应
     */
    ApiResponse<?> deleteVariable(HdocVariables request);

    /**
     * UD11: 搜索变量
     *
     * @param request 搜索条件（variable, type, description, createdByUser, date）
     * @return API响应，包含变量列表
     */
    ApiResponse<?> searchVariables(HdocVariables request);
}
