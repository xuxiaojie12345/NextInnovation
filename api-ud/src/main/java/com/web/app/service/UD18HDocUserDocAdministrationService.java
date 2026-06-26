package com.web.app.service;

import com.web.app.dto.UD18HDocUserDocAdministrationRequest;
import com.web.app.dto.UD18HDocUserDocAdministrationResponse;

/**
 * UD18 用户文档权限管理服务接口
 *
 * 功能说明：定义用户文档权限检查、查询、更新的业务方法
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
public interface UD18HDocUserDocAdministrationService {

    /**
     * 检查用户权限并获取用户信息
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD18HDocUserDocAdministrationResponse checkAuth(UD18HDocUserDocAdministrationRequest request);

    /**
     * 获取用户文档类型
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD18HDocUserDocAdministrationResponse getUserDoc(UD18HDocUserDocAdministrationRequest request);

    /**
     * 更新用户文档权限
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD18HDocUserDocAdministrationResponse updateDoc(UD18HDocUserDocAdministrationRequest request);
}
