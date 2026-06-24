package com.web.app.mapper;

import com.web.app.domain.VehicleSpecificationResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * UD07数据访问层
 * 对应详细设计：DES-VehicleSpecification-001
 *
 * 根据SERIE和CHNR关联查询HDOC_REC_DATA_OM、HDOC_REC_DATA_VDA_GENERAL、
 * HDOC_REC_DATA_VDA_VARIANTS、HDOC_REC_DATA_KOLA_VARIANT表，获取车辆规格信息。
 */
@Mapper
public interface UD07Mapper {

    /**
     * 查询车辆基本信息
     *
     * @param serie 底盘系列号（SERIE）
     * @param chnr  底盘编号（CHNR）
     * @return 车辆基本信息
     */
    VehicleSpecificationResponse.ChassisInfo selectChassisInfo(
            @Param("serie") String serie,
            @Param("chnr") String chnr);

    /**
     * 查询发动机/符号信息
     *
     * @param serie 底盘系列号（SERIE）
     * @param chnr  底盘编号（CHNR）
     * @return 发动机/符号信息
     */
    VehicleSpecificationResponse.EngineInfo selectEngineInfo(
            @Param("serie") String serie,
            @Param("chnr") String chnr);
}
