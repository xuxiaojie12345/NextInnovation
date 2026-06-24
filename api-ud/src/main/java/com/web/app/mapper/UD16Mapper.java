package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Map;

@Mapper
public interface UD16Mapper {

    Map<String, Object> selectHdocAdcaChange(@Param("serie") String serie, @Param("chnr") String chnr);

    int insertHdocAdcaChange(@Param("serie") String serie, @Param("chnr") String chnr,
                             @Param("reason") String reason);

    int logicalDeleteHdocAdcaChange(@Param("serie") String serie, @Param("chnr") String chnr,
                                    @Param("user") String user, @Param("process") String process);
}
