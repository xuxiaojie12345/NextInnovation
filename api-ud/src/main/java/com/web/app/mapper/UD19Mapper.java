package com.web.app.mapper;

import java.util.List;
import java.util.Map;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UD19Mapper {

  List<String> selectAllMarketCodes();

  List<Map<String, Object>> searchHdoc(
      @Param("userid") String userid,
      @Param("user") String user,
      @Param("market") String market,
      @Param("check") String check);
}
