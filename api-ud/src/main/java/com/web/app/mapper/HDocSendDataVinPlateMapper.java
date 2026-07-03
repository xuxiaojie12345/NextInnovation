package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Map;

@Mapper
public interface HDocSendDataVinPlateMapper {

    Map<String, Object> selectVinPlateInfo(@Param("serie") String serie, @Param("chnr") String chnr);

    int updateStatus(@Param("serie") String serie, @Param("chnr") String chnr,
                     @Param("status") String status, @Param("type") String type,
                     @Param("process") String process,
                     @Param("updateUser") String updateUser);

    int updateStatusAndType(@Param("serie") String serie, @Param("chnr") String chnr,
                            @Param("status") String status, @Param("type") String type,
                            @Param("process") String process,
                            @Param("updateUser") String updateUser);
}
