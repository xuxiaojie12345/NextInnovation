package com.web.app.service;

import com.web.app.dto.UD03SelectHdocdocumentlistResponse;

/**
 * UD03 文档类型列表服务接口
 * 
 * 功能说明：提供获取文档类型列表的业务逻辑
 * 
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-18
 */
public interface UD03SelectHdocdocumentlistService {

    /**
     * 获取文档类型列表
     * 对应设计文档 4.3 - 控制器层调用此方法
     * 
     * 业务逻辑：
     * 1. 查询 HDOC_DOCUMENT_LIST 表中所有的 DOCTYPE 文档类型
     * 2. 按 DOCTYPE 排序
     * 3. 返回文档类型列表
     * 
     * @return UD03SelectHdocdocumentlistResponse 响应对象，包含文档类型列表
     */
    UD03SelectHdocdocumentlistResponse getHdocDocumentList();
}
