package com.web.app.service;

import com.web.app.dto.UD20MarketDocumentSettingsRequest;
import com.web.app.dto.UD20MarketDocumentSettingsResponse;

/**
 * UD20-1 市场文档设置更新服务接口
 *
 * 功能说明：定义文档设置更新的业务方法
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-07-01
 */
public interface UD20MarketDocumentSettingsService {

    /**
     * 更新文档列表
     * 对应设计文档 4.3 - 控制器层调用此方法
     *
     * 业务逻辑：
     * 1. 对请求参数进行非空、合法性校验
     * 2. 检查该 DOCTYPE 是否存在于 HDOC_DOCUMENT_LIST 表
     * 3. 更新 HDOC_DOCUMENT_LIST 表的 REGISTER_USER 和 REGISTER_DATETIME
     *
     * @param request 请求对象，包含 doctype, registerUser, registerDatetime
     * @return UD20MarketDocumentSettingsResponse 响应对象
     */
    UD20MarketDocumentSettingsResponse updateDocument(UD20MarketDocumentSettingsRequest request);
}
