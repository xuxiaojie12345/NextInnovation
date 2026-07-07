package com.web.app.service;

import java.util.Map;

/**
 * UD20-1业务逻辑接口
 * 提供UD20-1UpdateHdocDocumentList方法 - 更新HDOC_DOCUMENT_LIST表
 */
public interface UD201Service {

    /**
     * 更新HDOC_DOCUMENT_LIST表
     *
     * @param doctype 文档类型
     * @param request 请求参数（含user, date等）
     * @return 错误消息，null表示成功
     */
    String updateHdocDocumentList(String doctype, Map<String, String> request);
}
