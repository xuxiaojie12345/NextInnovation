package com.web.app.mapper;

import com.web.app.entity.MarketMaster;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MarketMasterMapper {

  List<MarketMaster> selectAllMarkets();

  List<String> selectAllMarketCodes();
}
