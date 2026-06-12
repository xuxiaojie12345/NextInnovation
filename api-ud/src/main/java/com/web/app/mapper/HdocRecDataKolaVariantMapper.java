package com.web.app.mapper;

import org.springframework.stereotype.Repository;
import com.web.app.entity.HdocRecDataKolaVariant;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Repository
public interface HdocRecDataKolaVariantMapper {
    List<HdocRecDataKolaVariant> selectByFamilyIdAndVariantId(@Param("familyId") String familyId, @Param("variantId") String variantId);
}
