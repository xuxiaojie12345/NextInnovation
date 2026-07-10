package com.web.app.mapper;

import com.web.app.entity.HdocAdcaChange;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ADChangeMapper {

  HdocAdcaChange findBySerieAndChnr(@Param("serie") String serie, @Param("chnr") String chnr);

  int insert(
      @Param("serie") String serie,
      @Param("chnr") String chnr,
      @Param("act") String act,
      @Param("bu") String bu,
      @Param("reason") String reason,
      @Param("currentUser") String currentUser);

  int updateAllActToN(@Param("currentUser") String currentUser);
}
