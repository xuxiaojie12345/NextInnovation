package com.web.app.service;

import java.util.List;
import java.util.Map;

/**
 * UD18_HDocUserDocAdministration 服务接口
 * 提供用户文档权限管理功能
 */
public interface UD18HDocUserDocAdministrationService {

    /**
     * 获取所有文档列表
     *
     * @return 文档列表
     */
    List<Map<String, Object>> getDocumentList();

    /**
     * 查询用户文档权限
     *
     * @param userid 用户ID
     * @return 文档权限列表
     */
    List<Map<String, Object>> selectUserDoc(String userid);

    /**
     * 更新用户文档权限
     *
     * @param params 请求参数
     */
    void updateUserDoc(Map<String, Object> params);
}
