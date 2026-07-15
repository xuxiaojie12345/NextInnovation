package com.web.app.mapper;

import com.web.app.domain.entity.MarketMaster;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UD14数据访问层
 * 对应全体APIのプロンプト.txt 【UD14SearchresultistApi】
 */
@Mapper
/**

 * UD14Mapper

 */

public interface UD14Mapper {

    /**
     * 查询所有市场信息
     */
    List<MarketMaster> selectAllMarketMaster();

    /**
     * 根据市场代码和文件路径查询引用次数
     */
    int countByMarketAndFileName(@Param("market") String market, @Param("val") String val);
}
