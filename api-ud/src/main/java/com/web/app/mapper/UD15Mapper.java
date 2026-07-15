package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Map;

/**
 * UD15数据访问层 - VIN Plate
 */
@Mapper
/**

 * UD15Mapper

 */

public interface UD15Mapper {

    /**
     * 查看VIN Plate信息
     */
    Map<String, Object> selectVinPlateInfo(@Param("serie") String serie, @Param("chnr") String chnr);

    /**
     * 更新STATUS
     */
    int updateStatus(@Param("serie") String serie, @Param("chnr") String chnr,
                     @Param("status") String status, @Param("updateUser") String updateUser);

    /**
     * 更新STATUS和TYPE
     */
    int updateStatusAndType(@Param("serie") String serie, @Param("chnr") String chnr,
                            @Param("status") String status, @Param("type") String type,
                            @Param("updateUser") String updateUser);
}
