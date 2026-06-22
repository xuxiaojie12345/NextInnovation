package com.web.app.mapper;

import org.apache.ibatis.annotations.*;

/**
 * HDOC_ADCA_CHANGE Mapper接口
 * 提供AD Change信息的查询、插入和删除操作
 */
@Mapper
public interface HdocAdcaChangeMapper {

    /**
     * 查询AD Change记录数（存在性检查）
     *
     * @param serie 系列编号
     * @param chnr  底盘号
     * @return 记录数
     */
    @Select("SELECT COUNT(1) FROM HDOC_ADCA_CHANGE WHERE SERIE = #{serie} AND CHNR = #{chnr}")
    int countBySerieAndChnr(@Param("serie") String serie, @Param("chnr") String chnr);

    /**
     * 新增AD Change记录
     *
     * @param serie      系列编号
     * @param chnr       底盘号
     * @param act        状态
     * @param bu         业务单元
     * @param reason     描述
     * @param user       用户
     * @param dateTime   日期时间
     * @return 影响行数
     */
    @Insert("INSERT INTO HDOC_ADCA_CHANGE (SERIE, CHNR, ACT, BU, REASON, REGISTER_USER, REGISTER_DATETIME) " +
            "VALUES (#{serie}, #{chnr}, 'Y', 'UD', #{reason}, #{user}, #{dateTime})")
    int insert(@Param("serie") String serie, @Param("chnr") String chnr,
               @Param("act") String act, @Param("bu") String bu,
               @Param("reason") String reason, @Param("user") String user,
               @Param("dateTime") String dateTime);

    /**
     * 删除AD Change记录
     *
     * @param serie 系列编号
     * @param chnr  底盘号
     * @return 影响行数
     */
    @Delete("DELETE FROM HDOC_ADCA_CHANGE WHERE SERIE = #{serie} AND CHNR = #{chnr}")
    int deleteBySerieAndChnr(@Param("serie") String serie, @Param("chnr") String chnr);
}
