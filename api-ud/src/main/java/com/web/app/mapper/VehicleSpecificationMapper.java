package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.LinkedHashMap;
import java.util.List;

/**
 * UD07_VehicleSpecification Mapper接口
 */
@Mapper
public interface VehicleSpecificationMapper {

    /**
     * 查询车辆规格主数据
     * 关联 HDOC_REC_DATA_VDA_GENERAL, HDOC_REC_DATA_OM,
     *       HDOC_REC_DATA_VDA_VARIANTS, HDOC_REC_DATA_KOLA_VARIANT
     *
     * @param serie 系列编号
     * @param chno  底盘号
     * @return 车辆规格数据
     */
    LinkedHashMap<String, Object> selectVehicleSpecData(@Param("serie") String serie, @Param("chno") String chno);

    /**
     * 查询KOLA Variant格式化后的符号数据
     *
     * @param familyId  家族ID
     * @param variantId 变体ID
     * @return 符号数据列表
     */
    List<LinkedHashMap<String, Object>> selectKolaVariantByFamilyAndVariant(
            @Param("familyId") String familyId, @Param("variantId") String variantId);
}
