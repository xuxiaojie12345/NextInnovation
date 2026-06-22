package com.web.app.mapper;

import com.web.app.entity.HdocAdcaModification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

/**
 * ADCA修改Mapper接口
 */
@Mapper
public interface HdocAdcaModificationMapper {
    
    /**
     * 根据条件查询
     */
    List<HdocAdcaModification> selectByCondition(@Param("serie") String serie, @Param("chno") String chno);
    
    /**
     * 更新修改值
     */
    int updateNewVal(@Param("serie") String serie, @Param("chno") String chno, 
                     @Param("variable") String variable, @Param("modifiedValue") String modifiedValue);
}
