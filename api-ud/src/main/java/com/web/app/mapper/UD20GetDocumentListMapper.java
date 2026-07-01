package com.web.app.mapper;

import com.web.app.dto.UD20GetDocumentListResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UD20 获取文档列表数据访问层
 *
 * 功能说明：查询 HDOC_DOCUMENT_LIST 表获取文档列表信息
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-07-01
 */
@Mapper
public interface UD20GetDocumentListMapper {

    /**
     * 动态条件查询文档列表
     * 对应设计文档 5.41 - 查询语句（动态条件）
     *
     * SQL：SELECT DOCTYPE, DESCRIPTION FROM HDOC_DOCUMENT_LIST
     * 支持按 doctype（模糊）、registerUser、registerDatetime（>=）动态查询
     *
     * @param doctype          文档类型（支持模糊查询）
     * @param registerUser     注册用户
     * @param registerDatetime 注册日期（大于等于条件）
     * @return 文档数据列表
     */
    List<UD20GetDocumentListResponse.DocumentData> selectDocumentList(
            @Param("doctype") String doctype,
            @Param("registerUser") String registerUser,
            @Param("registerDatetime") String registerDatetime);
}
