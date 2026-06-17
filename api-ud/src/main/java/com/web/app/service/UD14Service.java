package com.web.app.service;

import com.web.app.domain.ApiResponse;

/**
 * UD14 Service
 * 提供市场列表获取、根据市场和文件名获取变量列表业务逻辑
 */
public interface UD14Service {

    /**
     * 获取市场列表
     *
     * @return API响应，包含市场列表
     */
    ApiResponse<?> getMarkets();

    /**
     * 根据市场获取模板文件及使用变量列表
     *
     * @param market 市场代码
     * @return API响应，包含模板文件列表
     */
    ApiResponse<?> getVariablesByMarket(String market);
}
