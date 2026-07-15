package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
/**

 * UD17Mapper

 */

public interface UD17Mapper {

    List<Map<String, String>> selectAllMarkets();

    String selectUsername(@Param("userid") String userid);

    List<Map<String, Object>> selectFunctionAuth(@Param("userid") String userid);

    List<Map<String, Object>> selectMarketAuth(@Param("userid") String userid);

    int deleteAllFunctionAuth(@Param("userid") String userid);

    int deleteAllMarketAuth(@Param("userid") String userid);

    int insertFunctionAuth(@Param("function") String function, @Param("userid") String userid,
                           @Param("registerUser") String registerUser, @Param("registerProcess") String registerProcess);

    int insertMarketAuth(@Param("userid") String userid, @Param("market") String market,
                         @Param("type") String type, @Param("bu") String bu,
                         @Param("registerUser") String registerUser, @Param("registerProcess") String registerProcess);
}
