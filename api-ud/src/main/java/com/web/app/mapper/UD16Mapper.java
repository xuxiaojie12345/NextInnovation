package com.web.app.mapper;

import com.web.app.domain.Entity.HdocAdcaChange;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * UD16 Mapper
 * 用于操作HDOC_ADCA_CHANGE表数据
 */
@Mapper
public interface UD16Mapper {

    /**
     * 根据SERIE和CHNR查询AD Change信息
     */
    HdocAdcaChange selectByPrimaryKey(@Param("serie") String serie,
                                      @Param("chnr") String chnr);

    /**
     * 检查记录是否存在
     */
    int countByPrimaryKey(@Param("serie") String serie,
                          @Param("chnr") String chnr);

    /**
     * 插入新记录
     */
    int insert(HdocAdcaChange record);

    /**
     * 逻辑删除（将ACT置为'N'）
     */
    int softDelete(@Param("serie") String serie,
                   @Param("chnr") String chnr,
                   @Param("updateUser") String updateUser,
                   @Param("updateProcess") String updateProcess);
}
