package com.web.app.mapper;

import com.web.app.entity.HdocAdcaModification;
import org.apache.ibatis.annotations.Param;
import java.util.List;

public interface HdocAdcaModificationMapper {
    List<HdocAdcaModification> selectBySerieAndChassisNo(@Param("serie") String serie, @Param("chassisNo") String chassisNo);
    List<HdocAdcaModification> selectByChassisNo(@Param("chassisNo") String chassisNo);
    int insertBatch(List<HdocAdcaModification> list);
    int deleteBySerieAndChassisNo(@Param("serie") String serie, @Param("chassisNo") String chassisNo);
}
