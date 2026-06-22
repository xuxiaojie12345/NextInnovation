package com.web.app.mapper;

import com.web.app.entity.UD04GenerateDocumentVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * UD04 生成文档数据访问层
 * 
 * 功能说明：通过多表关联查询获取生成文档所需数据
 * 关联表：HDOC_REC_DATA_VDA_GENERAL, HDOC_REC_DATA_OM, 
 *         HDOC_REC_DATA_KOLA_TIRE_MASTER, HDOC_ADCA_CHANGE, 
 *         HDOC_ADCA_MODIFICATION
 * 
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-18
 */
@Mapper
public interface UD04SelectGeneratedocumentMapper {

    /**
     * 根据底盘系列和底盘编号查询生成文档数据
     * 对应设计文档 5.3 - 查询语句:
     * SELECT om.ORDERNUMBER, om.BUILD, om.SPEC, om.CUSTOMER_ADAP, vda.COUNTRY_OF_OPERATION, 
     *        tire.LOAD_INDEX, cha.ACT, admod.VARIABLE
     * FROM HDOC_REC_DATA_VDA_GENERAL vda
     * INNER JOIN HDOC_REC_DATA_OM om ON vda.SERIE = om.SERIE AND vda.CHNR = om.CHNR
     * INNER JOIN HDOC_REC_DATA_KOLA_TIRE_MASTER tire ON vda.TRANS_TS = tire.TRANS_TS
     * INNER JOIN HDOC_ADCA_CHANGE cha ON vda.SERIE = cha.SERIE AND vda.CHNR = cha.CHNR
     * INNER JOIN HDOC_ADCA_MODIFICATION admod ON vda.SERIE = admod.SERIE AND vda.CHNR = admod.CHNO
     * WHERE vda.SERIE = #{chassisSerie} AND vda.CHNR = #{chassisNo} AND admod.STA = '0'
     * 
     * @param chassisSerie 底盘系列
     * @param chassisNo 底盘编号
     * @return 生成文档数据，如果不存在返回null
     */
    UD04GenerateDocumentVO selectDocumentData(@Param("chassisSerie") String chassisSerie, 
                                               @Param("chassisNo") String chassisNo);
}
