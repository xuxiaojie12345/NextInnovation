package com.web.app.service;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocDocumentList;

/**
 * UD19 Service
 * 提供HDoc用户搜索业务逻辑
 */
public interface UD19Service {

    /**
     * 获取市场列表
     */
    ApiResponse<?> getMarketList();

    /**
     * 搜索HDOC用户
     */
    ApiResponse<?> searchHdoc(HdocDocumentList request);
}
