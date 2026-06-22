package com.web.app.mapper;

import com.web.app.domain.HdocDocumentList;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;
import java.util.Map;

/**
 * HDOC_DOCUMENT_LIST Mapper接口
 */
@Mapper
public interface HdocDocumentListMapper {

    /**
     * 查询所有文档类型（去重）
     * 
     * @return 文档类型列表
     */
    List<HdocDocumentList> selectAllDoctypes();

    /**
     * 查询所有文档类型和描述
     *
     * @return 文档列表
     */
    @Select("SELECT DOCTYPE, DESCRIPTION FROM HDOC_DOCUMENT_LIST")
    List<Map<String, Object>> selectAllDoctypeDescriptions();

    /**
     * 动态条件查询文档列表
     *
     * @param params 查询条件
     * @return 文档列表
     */
    List<Map<String, Object>> selectByConditions(Map<String, Object> params);

    /**
     * 根据文档类型查询记录数
     *
     * @param doctype 文档类型
     * @return 记录数
     */
    @Select("SELECT COUNT(1) FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE = #{doctype}")
    int countByDoctype(@Param("doctype") String doctype);

    /**
     * 更新文档信息
     *
     * @param doctype 文档类型
     * @param user    用户
     * @param date    日期
     * @return 影响行数
     */
    @Update("UPDATE HDOC_DOCUMENT_LIST SET REGISTER_USER = #{user}, REGISTER_DATETIME = #{date} WHERE DOCTYPE = #{doctype}")
    int updateDocument(@Param("doctype") String doctype, @Param("user") String user, @Param("date") String date);
}
