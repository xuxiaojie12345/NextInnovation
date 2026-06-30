package com.web.app.mapper;

import com.web.app.entity.HdocAdcaChange;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.time.LocalDateTime;

@Mapper
public interface HdocAdcaChangeMapper {
    HdocAdcaChange selectBySerieAndChnr(@Param("serie") String serie, @Param("chnr") String chnr);
    int insertAdcaChange(HdocAdcaChange record);
    int updateActToN(@Param("serie") String serie, @Param("chnr") String chnr,
                     @Param("updateUser") String updateUser,
                     @Param("updateDatetime") LocalDateTime updateDatetime,
                     @Param("updateProcess") String updateProcess);
}
