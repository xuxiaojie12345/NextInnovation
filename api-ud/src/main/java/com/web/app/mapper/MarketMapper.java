package com.web.app.mapper;

import java.util.List;

/**
 * Market 主数据访问层
 * 对应后端提示词 5. 数据库设计（SQL 5.1）
 */
public interface MarketMapper {

    /**
     * 检索 Market 列表（画面初期表示时调用）
     * 对应 SQL 5.1：SELECT MARKET FROM MARKET_MASTER
     *
     * @return Market 代码列表
     */
    List<String> selectMarketList();
}
