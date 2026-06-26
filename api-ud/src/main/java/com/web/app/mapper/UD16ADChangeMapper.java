package com.web.app.mapper;

import com.web.app.entity.HdocAdcaChange;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * UD16 AD/CA变更数据访问层
 *
 * 功能说明：执行AD/CA变更记录的查询、插入、更新操作
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Mapper
public interface UD16ADChangeMapper {

    /**
     * 根据系列和底盘号查询AD/CA变更记录
     *
     * @param serie 系列
     * @param chnr  底盘号
     * @return AD/CA变更实体
     */
    HdocAdcaChange selectAdcaChange(@Param("serie") String serie, @Param("chnr") String chnr);

    /**
     * 插入AD/CA变更记录
     *
     * @param adcaChange 变更实体
     * @return 影响行数
     */
    Integer insertAdcaChange(HdocAdcaChange adcaChange);

    /**
     * 更新AD/CA变更记录（ACT = 'Y'）
     *
     * @param serie 系列
     * @param chnr  底盘号
     * @return 影响行数
     */
    Integer updateAdcaChangeActY(@Param("serie") String serie, @Param("chnr") String chnr);

    /**
     * 更新AD/CA变更记录（ACT = 'U'）
     *
     * @param serie 系列
     * @param chnr  底盘号
     * @return 影响行数
     */
    Integer updateAdcaChangeActU(@Param("serie") String serie, @Param("chnr") String chnr);
}
