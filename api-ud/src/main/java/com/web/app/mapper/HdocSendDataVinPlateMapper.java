package com.web.app.mapper;

import org.springframework.stereotype.Repository;
import com.web.app.entity.HdocSendDataVinPlate;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Repository
public interface HdocSendDataVinPlateMapper {
    HdocSendDataVinPlate selectBySerieAndChnr(@Param("serie") String serie, @Param("chnr") String chnr);
    int updateStatus(@Param("serie") String serie, @Param("chnr") String chnr, @Param("status") Long status);
    int updateStatusAndType(@Param("serie") String serie, @Param("chnr") String chnr, @Param("status") Long status, @Param("type") String type);
}
