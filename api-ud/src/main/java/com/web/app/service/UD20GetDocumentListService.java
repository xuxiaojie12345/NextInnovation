package com.web.app.service;

import java.util.List;
import java.util.Map;

/**
 * UD20_GetDocumentList 服务接口
 * 提供文档列表查询功能
 */
public interface UD20GetDocumentListService {

    /**
     * 查询文档列表
     *
     * @param params 查询条件
     * @return 文档列表
     */
    List<Map<String, Object>> getDocumentList(Map<String, Object> params);
}
