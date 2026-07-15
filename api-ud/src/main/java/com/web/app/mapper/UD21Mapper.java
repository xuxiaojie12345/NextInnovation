package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
/**

 * UD21Mapper

 */

public interface UD21Mapper {
    List<Map<String, String>> selectMarket();
}
