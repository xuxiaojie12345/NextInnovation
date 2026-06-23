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
}
