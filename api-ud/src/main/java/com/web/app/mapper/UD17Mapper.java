package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface UD17Mapper {

    List<Map<String, String>> selectAllMarkets();

    String selectUsername(@Param("userid") String userid);

    List<Map<String, Object>> selectFunctionAuth(@Param("userid") String userid);

    List<Map<String, Object>> selectMarketAuth(@Param("userid") String userid);

    int updateMarketAuth(@Param("userid") String userid, @Param("market") String market,
                         @Param("type") String type, @Param("bu") String bu,
                         @Param("updateUser") String updateUser, @Param("updateProcess") String updateProcess);

    int updateFunctionAuth(@Param("function") String function, @Param("userid") String userid,
                           @Param("updateUser") String updateUser, @Param("updateProcess") String updateProcess);

    int deleteMarketAuth(@Param("userid") String userid, @Param("market") String market,
                         @Param("type") String type, @Param("bu") String bu);

    int deleteFunctionAuth(@Param("function") String function, @Param("userid") String userid);
}
