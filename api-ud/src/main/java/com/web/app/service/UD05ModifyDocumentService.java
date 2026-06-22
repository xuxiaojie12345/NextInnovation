package com.web.app.service;

import com.web.app.dto.UD05ModifyDocumentRequest;
import com.web.app.dto.UD05ModifyDocumentResponse;
import com.web.app.dto.UD05ModifyDocumentUpdateRequest;

/**
 * UD05 修改文档变量服务接口
 *
 * 功能说明：实现文档变量查询与更新业务逻辑
 *
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-18
 */
public interface UD05ModifyDocumentService {

    /**
     * 查询修改文档变量数据
     *
     * @param request 查询请求对象
     * @return 响应对象
     */
    UD05ModifyDocumentResponse UD05SelectVariableModification(UD05ModifyDocumentRequest request);

    /**
     * 更新 HDOC_ADCA_MODIFICATION 表中的 NEWVAL 字段
     *
     * @param request 更新请求对象
     * @return 响应对象
     */
    UD05ModifyDocumentResponse UD05UpdateHdocAdcaModification(UD05ModifyDocumentUpdateRequest request);
}
