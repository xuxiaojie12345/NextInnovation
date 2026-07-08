package com.web.app.mapper;

import com.web.app.entity.UD07KolaVariantVO;
import com.web.app.entity.UD07VehicleSpecificationVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UD07 车辆规格数据访问层
 *
 * 功能说明：执行车辆规格主数据和KOLA变体数据查询
 *
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-22
 */
@Mapper
public interface UD07VehicleSpecificationMapper {

        /**
         * 查询车辆规格主数据
         *
         * @param serie 底盘系列
         * @param chno  底盘编号
         * @return 车辆规格视图对象列表
         */
        List<UD07VehicleSpecificationVO> selectVehicleSpecification(
                        @Param("serie") String serie,
                        @Param("chno") String chno);

        /**
         * 查询KOLA变体列表
         *
         * @param familyId  Family ID
         * @param variantId Variant ID
         * @return KOLA变体列表
         */
        List<UD07KolaVariantVO> selectKolaVariants(
                        @Param("familyId") String familyId,
                        @Param("variantId") String variantId);
}
