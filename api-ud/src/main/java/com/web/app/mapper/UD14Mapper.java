package com.web.app.mapper;

import com.web.app.domain.Entity.MarketMaster;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UD14 Mapper
 * 用于查询市场列表和变量信息
 */
@Mapper
public interface UD14Mapper {

    /**
     * 查询所有市场主数据
     *
     * @return 市场列表
     */
    List<MarketMaster> selectMarketMaster();

    /**
     * 根据市场和文件名查询使用中的变量
     *
     * @param market   市场代码
     * @param valValue VAL值（market/filename）
     * @return 变量名称列表
     */
    List<String> selectVariablesByVal(@Param("market") String market,
                                      @Param("valValue") String valValue);
}
