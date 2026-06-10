package com.web.app.service;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD04SelectGeneratedocumentRequest;
import com.web.app.domain.UD04SelectGeneratedocumentResponse;

/**
 * UD04 Select Generatedocument Service
 * 提供查询生成文档数据的业务逻辑
 */
public interface UD04SelectGeneratedocumentService {
    
    /**
     * 根据Chassis series和Chassis no查询生成文档数据
     * 
     * @param request 请求参数对象
     * @return API响应,包含查询结果
     */
    ApiResponse<UD04SelectGeneratedocumentResponse> selectGeneratedocument(UD04SelectGeneratedocumentRequest request);
}
