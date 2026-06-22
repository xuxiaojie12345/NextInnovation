package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface VehicleSpecificationMapper {

    Map<String, Object> selectVehicleBase(@Param("serie") String serie, @Param("chno") String chno);

    List<Map<String, Object>> selectKolaList(@Param("familyId") String familyId, @Param("variantId") String variantId);
}
