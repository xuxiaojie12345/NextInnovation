package com.web.app.mapper;

import java.util.List;
import java.util.Map;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserAdminMapper {

  List<Map<String, Object>> selectUserAuth(@Param("userid") String userid);

  Map<String, Object> selectUserInfo(@Param("userid") String userid);

  int deleteFunctionAuth(@Param("userid") String userid);

  int deleteMarketAuth(@Param("userid") String userid);

  int insertFunctionAuth(
      @Param("userid") String userid,
      @Param("function") String function,
      @Param("currentUser") String currentUser);

  int insertMarketAuth(
      @Param("userid") String userid,
      @Param("market") String market,
      @Param("type") String type,
      @Param("currentUser") String currentUser);
}
