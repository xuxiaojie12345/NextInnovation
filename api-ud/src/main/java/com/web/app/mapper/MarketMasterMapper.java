package com.web.app.mapper;

import com.web.app.entity.MarketMaster;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

/**
 * 市场主数据Mapper接口
 */
@Mapper
public interface MarketMasterMapper {
    
    /**
     * 查询所有市场
     */
    List<MarketMaster> selectAll();
}
