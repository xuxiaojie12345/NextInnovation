package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * UD20-1 更新文档列表数据访问层
 *
 * 功能说明：执行文档列表的更新操作
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Mapper
public interface UD201UpdateHdocDocumentMapper {

    /**
     * 根据文档类型更新文档列表
     *
     * @param doctype          文档类型
     * @param registerUser     注册用户
     * @param registerDatetime 注册时间
     * @return 影响行数
     */
    Integer updateDocumentList(
            @Param("doctype") String doctype,
            @Param("registerUser") String registerUser,
            @Param("registerDatetime") String registerDatetime);
}
