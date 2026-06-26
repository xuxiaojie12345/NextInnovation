package com.web.app.mapper;

import com.web.app.entity.MarketMaster;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UD14 搜索结果列表数据访问层
 *
 * 功能说明：执行市场列表和变量数据查询
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Mapper
public interface UD14SearchresultistMapper {

    /**
     * 查询所有市场
     *
     * @return 市场列表
     */
    List<MarketMaster> selectAllMarket();

    /**
     * 根据市场查询用户定义规则中的变量
     *
     * @param market 市场
     * @return 变量列表
     */
    List<String> selectVariableByMarket(@Param("market") String market);
}
