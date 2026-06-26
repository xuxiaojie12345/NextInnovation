package com.web.app.mapper;

import com.web.app.entity.HdocSendDataVinPlate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * UD15 VIN Plate数据数据访问层
 *
 * 功能说明：执行VIN Plate数据的查询和更新操作
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Mapper
public interface UD15SelecthdocsenddatavinplateMapper {

    /**
     * 根据底盘系列和底盘编号查询VIN Plate信息
     *
     * @param serie 底盘系列
     * @param chnr  底盘编号
     * @return VIN Plate实体
     */
    HdocSendDataVinPlate selectVinPlateInfo(@Param("serie") String serie, @Param("chnr") String chnr);

    /**
     * 根据底盘系列和底盘编号更新VIN Plate状态为重新生成（STATUS = '0'）
     *
     * @param serie 底盘系列
     * @param chnr  底盘编号
     * @return 影响行数
     */
    Integer updateStatusRegenerate(@Param("serie") String serie, @Param("chnr") String chnr);

    /**
     * 根据底盘系列和底盘编号更新VIN Plate状态为OK（STATUS = '1'）
     *
     * @param serie 底盘系列
     * @param chnr  底盘编号
     * @return 影响行数
     */
    Integer updateStatusSetOk(@Param("serie") String serie, @Param("chnr") String chnr);

    /**
     * 根据底盘系列和底盘编号更新VIN Plate为基础信息（STATUS = '0', TYPE = '1'）
     *
     * @param serie 底盘系列
     * @param chnr  底盘编号
     * @return 影响行数
     */
    Integer updateStatusChangeBasic(@Param("serie") String serie, @Param("chnr") String chnr);

    /**
     * 根据底盘系列和底盘编号更新VIN Plate为高级信息（STATUS = '0', TYPE = '2'）
     *
     * @param serie 底盘系列
     * @param chnr  底盘编号
     * @return 影响行数
     */
    Integer updateStatusChangeAdvanced(@Param("serie") String serie, @Param("chnr") String chnr);
}
