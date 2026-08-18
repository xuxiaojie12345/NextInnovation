package com.web.app.service;

import com.web.app.dto.MarketListResponse;
import com.web.app.dto.SearchUserRequest;
import com.web.app.dto.SearchUserResponse;

/**
 * SearchUser 业务逻辑层接口
 * 对应后端提示词 2.3 模块组成：服务接口
 */
public interface SearchUserService {

    /**
     * 用户信息检索（SearchUserApi 核心方法）
     * 处理流程对应后端提示词 4.4～4.8、设计书 3.1.2：
     * (1) Userid 检索：取得用户名 → 从用户 market 权限表取得 Market
     * (2) User 检索：先取得 Userid → 从用户 market 权限表取得 Market
     * (3) Not set：检索所有用户
     * (4) Rule：检索 Rule Admin 权限用户
     * (5) Template：检索 Template Admin 权限用户
     *
     * @param request 检索条件（serid / user / market / function）
     * @return 检索结果（token、count、users）
     */
    SearchUserResponse searchUser(SearchUserRequest request);

    /**
     * Market 列表检索（画面初期表示时调用）
     * 对应 SQL 5.1：SELECT MARKET FROM MARKET_MASTER
     *
     * @return Market 代码列表
     */
    MarketListResponse getMarketList();
}
