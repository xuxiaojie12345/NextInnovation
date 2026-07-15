package com.web.app.mapper;

import com.web.app.domain.GenerateDocumentQueryResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * UD04数据访问层
 * 对应详细设计：DES-GenerateDocumentPage-001
 *
 * 根据chassisSeries和chassisNo关联查询
 * HDOC_REC_DATA_VDA_GENERAL、HDOC_REC_DATA_OM、
 * HDOC_REC_DATA_KOLA_TIRE_MASTER、HDOC_ADCA_CHANGE、
 * HDOC_ADCA_MODIFICATION表，获取底盘完整信息
 */
@Mapper
/**

 * UD04Mapper

 */

public interface UD04Mapper {

    /**
     * 查询底盘文档信息
     *
     * @param chassisSeries 底盘系列号
     * @param chassisNo     底盘号
     * @return 底盘文档信息
     */
    GenerateDocumentQueryResponse selectGeneratedDocument(
            @Param("chassisSeries") String chassisSeries,
            @Param("chassisNo") String chassisNo);
}
