package com.web.app.service;

import com.web.app.dto.UD18HDocUserDocAdministrationRequest;
import com.web.app.dto.UD18HDocUserDocAdministrationResponse;

/**
 * UD18 用户文档权限管理服务接口
 *
 * 功能说明：定义用户文档权限检查、查询、新增、删除的业务方法
 * 对应全体API設計：UD18HDocUserDocAdministrationApi
 *
 * @author GitHub Copilot
 * @version 2.0
 * @date 2026-06-30
 */
public interface UD18HDocUserDocAdministrationService {

    /**
     * 4.1 - 检查用户权限（检查HDOC_FUNCTION_AUTH表中是否存在该用户）
     *
     * @param request 请求对象（userId）
     * @return 响应对象（data.exists: 是否存在）
     */
    UD18HDocUserDocAdministrationResponse checkAuth(UD18HDocUserDocAdministrationRequest request);

    /**
     * 4.2 - 获取用户文档类型（从HDOC_USER_DOC表查询）
     *
     * @param request 请求对象（userId, doctype可选）
     * @return 响应对象（data.doctype: 文档类型）
     */
    UD18HDocUserDocAdministrationResponse getUserDoc(UD18HDocUserDocAdministrationRequest request);

    /**
     * 4.3 - 新增用户文档权限（插入HDOC_USER_DOC表）
     *
     * @param request 请求对象（userId, doctype）
     * @return 响应对象
     */
    UD18HDocUserDocAdministrationResponse createDoc(UD18HDocUserDocAdministrationRequest request);

    /**
     * 4.4 - 删除用户文档权限（从HDOC_USER_DOC表删除）
     *
     * @param request 请求对象（userId, doctype）
     * @return 响应对象
     */
    UD18HDocUserDocAdministrationResponse deleteDoc(UD18HDocUserDocAdministrationRequest request);
}
