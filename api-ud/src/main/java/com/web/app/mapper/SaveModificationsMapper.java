package com.web.app.mapper;

import java.util.List;
import java.util.Map;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface SaveModificationsMapper {

  List<Map<String, Object>> selectModificationData(
      @Param("serie") String serie, @Param("chno") String chno);
}
