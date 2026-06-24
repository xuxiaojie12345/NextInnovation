package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface UD19Mapper {

    List<Map<String, String>> selectAllMarkets();

    List<Map<String, Object>> searchByUserId(@Param("userid") String userid);

    List<Map<String, Object>> searchByUser(@Param("user") String user);

    List<Map<String, Object>> searchByRule(@Param("market") String market);

    List<Map<String, Object>> searchByTemplate(@Param("market") String market);

    List<Map<String, Object>> searchAllUsers();
}
