package com.web.app.mapper;

import java.util.Map;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface HDocSendDataVinPlateMapper {

  Map<String, Object> selectVinPlateInfo(@Param("serie") String serie, @Param("chnr") String chnr);

  int updateStatus(
      @Param("serie") String serie,
      @Param("chnr") String chnr,
      @Param("status") String status,
      @Param("type") String type,
      @Param("process") String process,
      @Param("updateUser") String updateUser);

  int updateStatusAndType(
      @Param("serie") String serie,
      @Param("chnr") String chnr,
      @Param("status") String status,
      @Param("type") String type,
      @Param("process") String process,
      @Param("updateUser") String updateUser);
}
