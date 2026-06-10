package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * HDOC_REC_DATA_KOLA_VARIANT Mapper
 * 用于查询VDA变体信息
 */
@Mapper
public interface HdocRecDataKolaVariantMapper {
    
    /**
     * 根据FAMILY_ID和VARIANT_ID查询变体信息列表
     * 
     * @param familyId FAMILY_ID
     * @param variantId VARIANT_ID
     * @return 变体信息列表，包含SYMBOL_PREFIX、DESCRIPTION等
     */
    List<Map<String, Object>> selectVariantList(@Param("familyId") String familyId,
                                                 @Param("variantId") String variantId);
}
