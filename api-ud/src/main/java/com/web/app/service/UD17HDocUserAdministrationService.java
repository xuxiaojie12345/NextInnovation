package com.web.app.service;

import com.web.app.dto.UD17HDocUserAdministrationRequest;
import com.web.app.dto.UD17HDocUserAdministrationResponse;

/**
 * UD17 用户权限管理服务接口
 *
 * 功能说明：定义用户权限查询、更新、删除的业务方法
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
public interface UD17HDocUserAdministrationService {

    /**
     * 获取用户权限信息
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD17HDocUserAdministrationResponse UD17Userinfo(UD17HDocUserAdministrationRequest request);

    /**
     * 更新用户角色权限
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD17HDocUserAdministrationResponse UD17UpdateRole(UD17HDocUserAdministrationRequest request);

    /**
     * 删除用户权限
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD17HDocUserAdministrationResponse UD17DeleteRole(UD17HDocUserAdministrationRequest request);
}
