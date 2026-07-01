package com.web.app.service;

import com.web.app.dto.UD20GetDocumentListRequest;
import com.web.app.dto.UD20GetDocumentListResponse;

/**
 * UD20 获取文档列表服务接口
 *
 * 功能说明：定义文档列表查询的业务方法
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-07-01
 */
public interface UD20GetDocumentListService {

    /**
     * 查询文档列表
     * 对应设计文档 4.3 - 控制器层调用此方法
     *
     * 业务逻辑：
     * 1. 从 HDOC_DOCUMENT_LIST 表查询文档信息
     * 2. 支持按 doctype（模糊）、registerUser、registerDatetime 动态条件查询
     * 3. 返回文档列表数据
     *
     * @param request 请求对象，包含可选的查询条件
     * @return UD20GetDocumentListResponse 响应对象
     */
    UD20GetDocumentListResponse getDocumentList(UD20GetDocumentListRequest request);
}
