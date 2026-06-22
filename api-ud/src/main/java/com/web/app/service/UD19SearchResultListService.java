package com.web.app.service;

import java.util.List;
import java.util.Map;

/**
 * UD19_SearchResultList 服务接口
 * 提供用户搜索和市场权限查询功能
 */
public interface UD19SearchResultListService {

    /**
     * 搜索用户信息
     *
     * @param params 搜索条件
     * @return 用户列表
     */
    List<Map<String, Object>> search(Map<String, Object> params);
}
