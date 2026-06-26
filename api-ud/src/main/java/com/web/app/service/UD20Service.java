package com.web.app.service;

import com.web.app.domain.ApiResponse;

/**
 * UD20 Service
 * 提供文档类型列表业务逻辑
 */
public interface UD20Service {

    /**
     * 获取文档类型列表
     */
    ApiResponse<?> getDocumentList();

    /**
     * 根据条件搜索文档类型列表
     * @param documentType 文档类型
     * @param operator 操作符（= / > / <）
     * @return 搜索结果
     */
    ApiResponse<?> searchDocumentList(String documentType, String operator);
}
