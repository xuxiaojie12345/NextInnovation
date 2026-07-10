package com.web.app.mapper;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UD14SearchMapper {

  List<String> selectAllMarketCodes();

  List<String> selectVariablesByVal(@Param("val") String val);
}
