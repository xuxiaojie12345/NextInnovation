package com.web.app.mapper;

import com.web.app.entity.HdocAdcaChange;
import org.apache.ibatis.annotations.Param;

public interface HdocAdcaChangeMapper {
    HdocAdcaChange selectBySerieAndChnr(@Param("serie") String serie, @Param("chnr") String chnr);
    int insert(HdocAdcaChange record);
    int updateActToN(@Param("serie") String serie, @Param("chnr") String chnr);
}
