package com.web.app.mapper;

import org.springframework.stereotype.Repository;
import com.web.app.entity.HdocAdcaChange;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Repository
public interface HdocAdcaChangeMapper {
    HdocAdcaChange selectBySerieAndChnr(@Param("serie") String serie, @Param("chnr") String chnr);
    int countBySerieAndChnr(@Param("serie") String serie, @Param("chnr") String chnr);
    int insert(HdocAdcaChange record);
    int deleteBySerieAndChnr(@Param("serie") String serie, @Param("chnr") String chnr);
}
