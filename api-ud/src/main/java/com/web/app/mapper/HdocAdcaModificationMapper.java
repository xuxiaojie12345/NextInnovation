package com.web.app.mapper;

import org.springframework.stereotype.Repository;
import com.web.app.entity.HdocAdcaModification;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Repository
public interface HdocAdcaModificationMapper {
    List<HdocAdcaModification> selectBySerieAndChno(@Param("serie") String serie, @Param("chno") String chno);
    int updateNewvalByVariable(HdocAdcaModification record);
}
