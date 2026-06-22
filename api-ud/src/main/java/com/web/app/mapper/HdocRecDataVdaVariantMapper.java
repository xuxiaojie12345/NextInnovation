package com.web.app.mapper;

import com.web.app.entity.HdocRecDataVdaVariant;
import com.web.app.entity.VehicleBasicInfo;
import com.web.app.entity.KolaVariantSymbol;
import com.web.app.entity.KapSnote;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

/**
 * VDA Variant Mapper接口
 */
@Mapper
public interface HdocRecDataVdaVariantMapper {

    /**
     * 根据底盘编号查询VDA Variant数据
     */
    List<HdocRecDataVdaVariant> selectByChassisNo(@Param("chassisNo") String chassisNo);

    /**
     * 5.6-1: 查询车辆基本信息
     */
    List<VehicleBasicInfo> selectVehicleBasicInfo(@Param("serie") String serie, @Param("chnr") String chnr);

    /**
     * 5.6-2: 根据FAMILY_ID/VARIANT_ID查询SYMBOL_STR
     */
    List<KolaVariantSymbol> selectKolaVariantsByFamily(@Param("familyId") String familyId, @Param("variantId") String variantId);

    /**
     * 5.6-KAP: 根据SERIE/CHNR查询S-Note数据
     */
    List<KapSnote> selectSNoteBySerieChnr(@Param("serie") String serie, @Param("chnr") String chnr);
}
