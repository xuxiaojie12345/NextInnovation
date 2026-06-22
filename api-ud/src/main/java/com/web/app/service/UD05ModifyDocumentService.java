package com.web.app.service;

import com.web.app.dto.UD05ModifyDocumentRequest;
import com.web.app.dto.UD05ModifyDocumentResponse;
import com.web.app.dto.UD05UpdateRequest;

/**
 * UD05 - Modify Document服务接口
 */
public interface UD05ModifyDocumentService {

    /**
     * 查询变量修改信息
     */
    UD05ModifyDocumentResponse selectVariableModification(UD05ModifyDocumentRequest request);

    /**
     * 批量更新变量修改信息
     */
    UD05ModifyDocumentResponse updateHdocAdcaModification(UD05UpdateRequest request);
}
