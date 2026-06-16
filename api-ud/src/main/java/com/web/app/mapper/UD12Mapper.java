package com.web.app.mapper;

import com.web.app.domain.Entity.MarketMaster;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/**
 * UD12 Mapper
 * 用于查询市场主数据和文件操作
 */
@Mapper
public interface UD12Mapper {

    /**
     * 查询所有市场主数据
     *
     * @return 市场列表
     */
    List<MarketMaster> selectMarketMaster();
}
