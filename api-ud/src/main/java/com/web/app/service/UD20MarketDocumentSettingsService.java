package com.web.app.service;

import com.web.app.dto.UD20MarketDocumentSettingsRequest;
import com.web.app.dto.UD20MarketDocumentSettingsResponse;

/**
 * UD20 市场文档设置服务接口
 *
 * 功能说明：定义文档列表查询的业务方法
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
public interface UD20MarketDocumentSettingsService {

    /**
     * 获取文档列表
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD20MarketDocumentSettingsResponse getDocumentList(UD20MarketDocumentSettingsRequest request);
}
