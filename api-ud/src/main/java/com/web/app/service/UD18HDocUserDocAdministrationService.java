package com.web.app.service;

import com.web.app.dto.UD18HDocUserDocAdministrationRequest;
import com.web.app.dto.UD18HDocUserDocAdministrationResponse;

/**
 * UD18 - HDoc User Doc Administration服务接口
 */
public interface UD18HDocUserDocAdministrationService {

    /**
     * 获取全部文档列表（初期表示）
     */
    UD18HDocUserDocAdministrationResponse getDocumentList();

    /**
     * 查询用户文档权限
     */
    UD18HDocUserDocAdministrationResponse selectUserDoc(UD18HDocUserDocAdministrationRequest request);

    /**
     * 更新用户文档权限
     */
    UD18HDocUserDocAdministrationResponse updateUserDoc(UD18HDocUserDocAdministrationRequest request);
}
