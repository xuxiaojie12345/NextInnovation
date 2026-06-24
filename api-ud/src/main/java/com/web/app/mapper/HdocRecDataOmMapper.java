package com.web.app.mapper;

import com.web.app.dto.SelectGenerateDocumentResponse;
import com.web.app.dto.VehicleSpecificationResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface HdocRecDataOmMapper {
    SelectGenerateDocumentResponse selectHdocRecDataOm(@Param("serie") String serie, @Param("chnr") String chnr);
    VehicleSpecificationResponse selectVehicleSpecification(@Param("serie") String serie, @Param("chnr") String chnr);
}
