package com.web.app.service;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocDocumentList;

/**
 * UD18 Service
 * 提供HDoc用户文档权限管理业务逻辑
 */
public interface UD18Service {

    /**
     * 获取文档列表
     * GET /api/ud18HDocUserDocAdministration/getDocumentList
     */
    ApiResponse<?> getDocumentList();

    /**
     * 获取用户功能和文档权限
     * POST /api/ud18HDocUserDocAdministration/getUserFunctionsAndDocuments
     */
    ApiResponse<?> getUserFunctionsAndDocuments(HdocDocumentList request);

    /**
     * 更新用户文档权限
     * PUT /api/ud18HDocUserDocAdministration/updateUserDocuments
     */
    ApiResponse<?> updateUserDocuments(HdocDocumentList request);
}
