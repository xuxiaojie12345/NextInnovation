package com.web.app.service;

import com.web.app.domain.GenerateDocumentQueryResponse;

/**
 * UD04业务逻辑接口
 * 对应详细设计：DES-GenerateDocumentPage-001
 */
 /**

  * UD04Service

  */

public interface UD04Service {

    /**
     * 根据底盘号查询文档信息
     *
     * @param chassisSeries 底盘系列号
     * @param chassisNo     底盘号
     * @param documentType  文档类型
     * @return 底盘文档信息
     */
    GenerateDocumentQueryResponse selectGeneratedDocument(String chassisSeries, String chassisNo, String documentType);
}
