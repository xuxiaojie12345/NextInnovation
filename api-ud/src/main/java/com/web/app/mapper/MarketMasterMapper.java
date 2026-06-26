package com.web.app.mapper;

import com.web.app.entity.MarketMaster;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface MarketMasterMapper {
    List<MarketMaster> selectAllMarket();
    List<MarketMaster> selectMarketWithDescription();
}
