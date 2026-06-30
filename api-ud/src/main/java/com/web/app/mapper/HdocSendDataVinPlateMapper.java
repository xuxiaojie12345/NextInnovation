package com.web.app.mapper;

import com.web.app.entity.HdocSendDataVinPlate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.time.LocalDateTime;

@Mapper
public interface HdocSendDataVinPlateMapper {
    HdocSendDataVinPlate selectBySerieAndChnr(@Param("serie") String serie, @Param("chnr") String chnr);
    int updateStatusRegenerate(@Param("serie") String serie, @Param("chnr") String chnr,
                               @Param("updateUser") String updateUser,
                               @Param("updateDatetime") LocalDateTime updateDatetime,
                               @Param("updateProcess") String updateProcess);
    int updateStatusOk(@Param("serie") String serie, @Param("chnr") String chnr,
                       @Param("updateUser") String updateUser,
                       @Param("updateDatetime") LocalDateTime updateDatetime,
                       @Param("updateProcess") String updateProcess);
    int updateToBasicInfo(@Param("serie") String serie, @Param("chnr") String chnr,
                          @Param("updateUser") String updateUser,
                          @Param("updateDatetime") LocalDateTime updateDatetime,
                          @Param("updateProcess") String updateProcess);
    int updateToAdvancedInfo(@Param("serie") String serie, @Param("chnr") String chnr,
                             @Param("updateUser") String updateUser,
                             @Param("updateDatetime") LocalDateTime updateDatetime,
                             @Param("updateProcess") String updateProcess);
}
