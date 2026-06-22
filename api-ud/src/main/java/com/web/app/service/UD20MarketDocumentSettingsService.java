package com.web.app.service;

import com.web.app.dto.UD20GetDocumentListRequest;
import com.web.app.dto.UD20GetDocumentListResponse;
import com.web.app.dto.UD20MarketDocumentSettingsRequest;
import com.web.app.dto.UD20MarketDocumentSettingsResponse;

/**
 * UD20 - 文档列表查询和Market Document Settings服务接口
 */
public interface UD20MarketDocumentSettingsService {

    /**
     * 查询文档列表
     */
    UD20GetDocumentListResponse selectHdocDocumentList(UD20GetDocumentListRequest request);

    /**
     * 更新文档设置
     */
    UD20MarketDocumentSettingsResponse updateHdocDocumentList(UD20MarketDocumentSettingsRequest request);
}
