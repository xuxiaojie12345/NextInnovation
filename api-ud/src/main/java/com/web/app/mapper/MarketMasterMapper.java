package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 市场主数据 Mapper接口
 * 提供市场数据的查询操作
 */
@Mapper
public interface MarketMasterMapper {

    /**
     * 查询所有市场
     *
     * @return 市场列表（包含MARKET, DESCRIPTION字段）
     */
    @Select("SELECT MARKET AS market, DESCRIPTION AS description FROM MARKET_MASTER")
    List<Map<String, Object>> selectAllMarkets();
}
