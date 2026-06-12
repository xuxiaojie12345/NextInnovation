package com.web.app.mapper;

import com.web.app.entity.HdocAdcaChange;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * ADCA变更Mapper接口
 */
@Mapper
public interface HdocAdcaChangeMapper {
    
    /**
     * 根据条件查询
     */
    HdocAdcaChange selectByCondition(@Param("serie") String serie, @Param("chnr") String chnr);
    
    /**
     * 插入ADCA变更
     */
    int insert(HdocAdcaChange adcaChange);
    
    /**
     * 更新ADCA变更（逻辑删除）
     */
    int updateActToN(@Param("serie") String serie, @Param("chnr") String chnr);
}
