package com.web.app.service;

import com.web.app.dto.UD201UpdateHdocDocumentRequest;
import com.web.app.dto.UD201UpdateHdocDocumentResponse;

/**
 * UD20-1 更新文档列表服务接口
 *
 * 功能说明：定义文档更新操作的业务方法
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
public interface UD201UpdateHdocDocumentService {

    /**
     * 更新文档列表
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD201UpdateHdocDocumentResponse updateDocumentList(UD201UpdateHdocDocumentRequest request);
}
