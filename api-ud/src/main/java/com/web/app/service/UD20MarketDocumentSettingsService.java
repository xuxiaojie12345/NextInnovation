package com.web.app.service;

import java.util.Map;

/**
 * UD20_MarketDocumentSettings 服务接口
 * 提供文档信息更新功能
 */
public interface UD20MarketDocumentSettingsService {

    /**
     * 更新文档信息
     *
     * @param params 更新参数
     * @return 更新后的文档信息
     */
    Map<String, Object> updateDocument(Map<String, Object> params);
}
