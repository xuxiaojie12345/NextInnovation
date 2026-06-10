package com.web.app.mapper;

import com.web.app.domain.entity.MarketMaster;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/**
 * Market Mapper接口
 */
@Mapper
public interface MarketMapper {

    /**
     * 查询所有Market名称
     *
     * @return Market列表
     */
    List<MarketMaster> findAllMarkets();
}
