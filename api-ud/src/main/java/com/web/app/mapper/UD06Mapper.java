package com.web.app.mapper;

import com.web.app.domain.SaveModificationsQueryResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UD06数据访问层
 * 对应详细设计：DES-SaveModifications-001
 *
 * 根据serie和chno查询HDOC_ADCA_MODIFICATION表，
 * 获取DOCTYPE、VERS、VARIABLE、NEWVAL等信息。
 */
@Mapper
public interface UD06Mapper {

    /**
     * UD06SelectHdocAdcaModification
     * 根据serie和chno查询ADCA修改信息
     *
     * @param serie 底盘系列号
     * @param chno  底盘编号
     * @return 修改信息列表
     */
    List<SaveModificationsQueryResponse> selectHdocAdcaModification(
            @Param("serie") String serie,
            @Param("chno") String chno);
}
