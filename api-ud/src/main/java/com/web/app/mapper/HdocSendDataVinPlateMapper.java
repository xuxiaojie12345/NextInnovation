package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.LinkedHashMap;

/**
 * HDOC_SEND_DATA_VIN_PLATE Mapper接口
 * 提供VIN Plate数据传输数据的查询与状态更新
 */
@Mapper
public interface HdocSendDataVinPlateMapper {

    /**
     * 查询VIN Plate信息
     *
     * @param serie 系列编号
     * @param chnr  底盘号
     * @return VIN Plate数据
     */
    @Select("SELECT TYPE, STATUS, MSG, REGISTER_DATETIME, DOC_READY, DOC_SENT, XML_DOC " +
            "FROM HDOC_SEND_DATA_VIN_PLATE WHERE SERIE = #{serie} AND CHNR = #{chnr}")
    LinkedHashMap<String, Object> selectBySerieAndChnr(@Param("serie") String serie, @Param("chnr") String chnr);

    /**
     * 重置状态为0（Set Regenerate）
     *
     * @param serie 系列编号
     * @param chnr  底盘号
     * @return 影响行数
     */
    @Update("UPDATE HDOC_SEND_DATA_VIN_PLATE SET STATUS = 0 WHERE SERIE = #{serie} AND CHNR = #{chnr}")
    int updateStatusToRegenerate(@Param("serie") String serie, @Param("chnr") String chnr);

    /**
     * 设置状态为1（Set OK）
     *
     * @param serie 系列编号
     * @param chnr  底盘号
     * @return 影响行数
     */
    @Update("UPDATE HDOC_SEND_DATA_VIN_PLATE SET STATUS = 1 WHERE SERIE = #{serie} AND CHNR = #{chnr}")
    int updateStatusToOk(@Param("serie") String serie, @Param("chnr") String chnr);

    /**
     * 切换到基础信息（Status=0, Type='1'）
     *
     * @param serie 系列编号
     * @param chnr  底盘号
     * @return 影响行数
     */
    @Update("UPDATE HDOC_SEND_DATA_VIN_PLATE SET STATUS = 0, TYPE = '1' WHERE SERIE = #{serie} AND CHNR = #{chnr}")
    int updateToBasicInfo(@Param("serie") String serie, @Param("chnr") String chnr);

    /**
     * 切换到高级信息（Status=0, Type='2'）
     *
     * @param serie 系列编号
     * @param chnr  底盘号
     * @return 影响行数
     */
    @Update("UPDATE HDOC_SEND_DATA_VIN_PLATE SET STATUS = 0, TYPE = '2' WHERE SERIE = #{serie} AND CHNR = #{chnr}")
    int updateToAdvancedInfo(@Param("serie") String serie, @Param("chnr") String chnr);
}
