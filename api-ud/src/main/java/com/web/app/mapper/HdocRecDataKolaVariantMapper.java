package com.web.app.mapper;

import com.web.app.entity.HdocRecDataKolaVariant;
import org.apache.ibatis.annotations.Param;
import java.util.List;

public interface HdocRecDataKolaVariantMapper {
    List<HdocRecDataKolaVariant> selectByChassisNo(@Param("chassisNo") String chassisNo);
    HdocRecDataKolaVariant selectByFamilyAndVariant(@Param("familyId") String familyId, @Param("variantId") String variantId);
}
