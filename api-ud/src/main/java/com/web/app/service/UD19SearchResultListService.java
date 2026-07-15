package com.web.app.service;

import com.web.app.dto.UD19SearchResultListRequest;
import com.web.app.dto.UD19SearchResultListResponse;

/**
 * UD19 用户搜索结果列表服务接口
 *
 * 功能说明：定义市场列表查询和用户搜索的业务方法
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
public interface UD19SearchResultListService {

    /**
     * 获取市场列表
     *
     * @return 响应对象
     */
    UD19SearchResultListResponse UD19SelectMarketMaster();

    /**
     * 搜索用户
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD19SearchResultListResponse UD19SearchHdoc(UD19SearchResultListRequest request);
}
