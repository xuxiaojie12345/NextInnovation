package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface UD19Mapper {

    List<Map<String, String>> selectAllMarkets();

    List<Map<String, Object>> searchUsers(
        @Param("userId") String userId,
        @Param("user") String user,
        @Param("market") String market,
        @Param("type") String type
    );
}
