package com.web.app.mapper;

import com.web.app.entity.HdocSendDataVinPlate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * VIN Plate发送数据Mapper接口
 */
@Mapper
public interface HdocSendDataVinPlateMapper {
    
    /**
     * 根据条件查询
     */
    HdocSendDataVinPlate selectByCondition(@Param("serie") String serie, @Param("chnr") String chnr);
    
    /**
     * 更新状态为0（Regenerate）
     */
    int updateStatusToRegenerate(@Param("serie") String serie, @Param("chnr") String chnr);
    
    /**
     * 更新状态为1（OK）
     */
    int updateStatusToOk(@Param("serie") String serie, @Param("chnr") String chnr);
    
    /**
     * 更新为基本信息
     */
    int updateToBasicInfo(@Param("serie") String serie, @Param("chnr") String chnr);
    
    /**
     * 更新为高级信息
     */
    int updateToAdvancedInfo(@Param("serie") String serie, @Param("chnr") String chnr);
}
