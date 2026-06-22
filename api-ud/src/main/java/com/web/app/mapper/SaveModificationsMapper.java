package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SaveModificationsMapper {

    List<Map<String, Object>> selectModificationData(@Param("serie") String serie, @Param("chno") String chno);
}
