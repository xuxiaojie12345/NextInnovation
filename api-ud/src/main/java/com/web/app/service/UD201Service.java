package com.web.app.service;

import com.web.app.domain.ApiResponse;

/**
 * UD20-1 Service
 * 提供文档类型更新业务逻辑
 */
public interface UD201Service {

    /**
     * 更新HDOC_DOCUMENT_LIST表数据
     * @param doctype 文档类型（必填）
     * @param user 注册用户
     * @param date 注册日期
     * @return ApiResponse
     */
    ApiResponse<?> updateHdocDocumentList(String doctype, String user, String date);
}
