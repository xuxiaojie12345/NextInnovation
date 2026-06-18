package com.web.app.service;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocDocumentList;

/**
 * UD17 Service
 * 提供HDoc用户管理业务逻辑
 */
public interface UD17Service {

    /**
     * 获取市场列表
     */
    ApiResponse<?> getMarketList();

    /**
     * 获取用户信息
     */
    ApiResponse<?> getUserInfo(HdocDocumentList request);

    /**
     * 获取用户权限
     */
    ApiResponse<?> getUserPermissions(HdocDocumentList request);

    /**
     * 更新用户角色
     */
    ApiResponse<?> updateRole(HdocDocumentList request);

    /**
     * 删除用户角色
     */
    ApiResponse<?> deleteRole(HdocDocumentList request);
}
