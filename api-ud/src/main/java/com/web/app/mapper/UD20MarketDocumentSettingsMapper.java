package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * UD20-1 市场文档设置更新数据访问层
 *
 * 功能说明：更新 HDOC_DOCUMENT_LIST 表的文档信息
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-07-01
 */
@Mapper
public interface UD20MarketDocumentSettingsMapper {

    /**
     * 根据 DOCTYPE 统计记录数
     * 用于检查指定文档类型是否存在
     *
     * @param doctype 文档类型
     * @return 记录数
     */
    int countByDoctype(@Param("doctype") String doctype);

    /**
     * 更新文档列表
     * 对应设计文档 5.42 - 更新语句
     *
     * SQL：UPDATE HDOC_DOCUMENT_LIST SET
     * REGISTER_USER = #{registerUser},
     * REGISTER_DATETIME = #{registerDatetime}
     * WHERE DOCTYPE = #{doctype}
     *
     * @param doctype          文档类型（主键）
     * @param registerUser     注册用户
     * @param registerDatetime 注册日期时间
     * @return 影响的行数
     */
    int updateDocumentList(
            @Param("doctype") String doctype,
            @Param("user") String user,
            @Param("date") String date);
}
