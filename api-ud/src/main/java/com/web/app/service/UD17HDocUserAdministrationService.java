package com.web.app.service;

import java.util.Map;

/**
 * UD17_HDocUserAdministration 服务接口
 * 提供用户权限管理（查询、更新、删除权限）功能
 */
public interface UD17HDocUserAdministrationService {

    /**
     * 获取用户信息和权限
     *
     * @param userid 用户ID
     * @return 用户权限信息
     */
    Map<String, Object> getUserInfo(String userid);

    /**
     * 更新用户角色权限
     *
     * @param params 请求参数
     */
    void updateRole(Map<String, Object> params);

    /**
     * 删除用户角色权限
     *
     * @param userid 用户ID
     */
    void deleteRole(String userid);
}
