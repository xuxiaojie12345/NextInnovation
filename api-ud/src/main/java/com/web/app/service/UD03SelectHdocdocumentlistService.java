package com.web.app.service;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD03SelectHdocdocumentlistResponse;

/**
 * UD03 Select Hdocdocumentlist Service
 * 提供查询文档类型列表的业务逻辑
 */
public interface UD03SelectHdocdocumentlistService {
    
    /**
     * 查询所有文档类型列表
     * 
     * @return API响应，包含文档类型列表
     */
    ApiResponse<UD03SelectHdocdocumentlistResponse> selectHdocdocumentlist();
}
