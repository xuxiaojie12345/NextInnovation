package com.web.app.service;

import com.web.app.dto.UD17HDocUserAdministrationRequest;
import com.web.app.dto.UD17HDocUserAdministrationResponse;

/**
 * UD17 - HDoc User Administration服务接口
 */
public interface UD17HDocUserAdministrationService {

    /**
     * 查询用户信息
     */
    UD17HDocUserAdministrationResponse getUserInfo(UD17HDocUserAdministrationRequest request);

    /**
     * 更新用户角色
     */
    UD17HDocUserAdministrationResponse updateRole(UD17HDocUserAdministrationRequest request);

    /**
     * 删除用户角色
     */
    UD17HDocUserAdministrationResponse deleteRole(UD17HDocUserAdministrationRequest request);
}
