package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ADChangeMapper {

    int countBySerieAndChnr(@Param("serie") String serie, @Param("chnr") String chnr);

    int insert(@Param("serie") String serie, @Param("chnr") String chnr,
               @Param("act") String act, @Param("bu") String bu,
               @Param("reason") String reason, @Param("currentUser") String currentUser);

    int updateAllActToZero();
}
