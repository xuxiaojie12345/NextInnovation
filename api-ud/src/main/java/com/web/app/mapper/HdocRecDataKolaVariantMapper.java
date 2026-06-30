package com.web.app.mapper;

import com.web.app.dto.KolaVariantResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface HdocRecDataKolaVariantMapper {
    KolaVariantResponse selectByFamilyIdAndVariantId(@Param("familyId") String familyId, @Param("variantId") String variantId);
}
