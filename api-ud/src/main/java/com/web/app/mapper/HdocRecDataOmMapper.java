package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Map;

/**
 * HDOC_REC_DATA_OM Mapper
 * 用于查询车辆基础信息
 */
@Mapper
public interface HdocRecDataOmMapper {
    
    /**
     * 根据SERIE和CHNR查询车辆基础信息
     * 
     * @param serie Chassis series (前4位)
     * @param chnr Chassis number (剩余部分)
     * @return 车辆基础信息Map，包含Model、Built week、CUSTOMER_ADAP、VIN等
     */
    Map<String, Object> selectVehicleBaseInfo(@Param("serie") String serie, 
                                               @Param("chnr") String chnr);
}
