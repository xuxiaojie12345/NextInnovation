package com.web.app.service;

import java.util.List;
import java.util.Map;

/**
 * UD11_Hdocvariables 服务接口
 * 提供HDOC Variables的搜索查询功能
 */
public interface UD11HdocvariablesService {

    /**
     * 根据条件搜索HDOC Variables
     *
     * @param params 查询条件
     * @return 变量列表
     */
    List<Map<String, Object>> search(Map<String, Object> params);
}
