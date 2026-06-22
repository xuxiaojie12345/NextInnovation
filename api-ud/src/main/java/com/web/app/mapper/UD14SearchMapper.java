package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UD14SearchMapper {

    List<String> selectAllMarketCodes();

    List<String> selectVariablesByVal(@Param("val") String val);
}
