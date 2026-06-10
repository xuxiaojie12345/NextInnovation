package com.web.app.service;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD05ModifyDocumentResponse;
import com.web.app.domain.UD05ModifyDocumentSaveRequest;

/**
 * UD05 Modify Document Service
 * 提供修改文档的业务逻辑
 */
public interface UD05ModifyDocumentService {
    
    /**
     * 初期表示：根据Chassis series和Chassis no查询Variant信息
     * 
     * @param chassisSeries Chassis series (底盘系列号)
     * @param chassisNo Chassis no (底盘号码)
     * @return API响应，包含Variant信息
     */
    ApiResponse<UD05ModifyDocumentResponse> getModifyDocument(String chassisSeries, String chassisNo);
    
    /**
     * Save按钮压下时：更新Modify信息
     * 
     * @param request 保存请求对象
     * @return API响应
     */
    ApiResponse<Void> saveModifyDocument(UD05ModifyDocumentSaveRequest request);
}
