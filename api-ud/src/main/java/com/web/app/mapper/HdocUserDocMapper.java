package com.web.app.mapper;

import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Map;

/**
 * HDOC_USER_DOC Mapper接口
 * 提供用户文档权限的查询与更新操作
 */
@Mapper
public interface HdocUserDocMapper {

    /**
     * 查询用户文档权限
     *
     * @param userid 用户ID
     * @return 文档权限列表
     */
    @Select("SELECT DOCUMENTLIST.DOCTYPE, DOCUMENTLIST.DESCRIPTION " +
            "FROM HDOC_USER_DOC USERDOC " +
            "INNER JOIN HDOC_DOCUMENT_LIST DOCUMENTLIST " +
            "ON USERDOC.DOCTYPE = DOCUMENTLIST.DOCTYPE " +
            "WHERE USERDOC.USERID = #{userid}")
    List<Map<String, Object>> selectByUserid(@Param("userid") String userid);

    /**
     * 删除用户文档权限
     *
     * @param userid 用户ID
     * @return 影响行数
     */
    @Delete("DELETE FROM HDOC_USER_DOC WHERE USERID = #{userid}")
    int deleteByUserid(@Param("userid") String userid);

    /**
     * 插入用户文档权限
     *
     * @param userid      用户ID
     * @param doctype     文档类型
     * @param user        操作用户
     * @param dateTime    日期时间
     * @return 影响行数
     */
    @Insert("INSERT INTO HDOC_USER_DOC (USERID, DOCTYPE, REGISTER_USER, REGISTER_DATETIME) " +
            "VALUES (#{userid}, #{doctype}, #{user}, #{dateTime})")
    int insert(@Param("userid") String userid, @Param("doctype") String doctype,
               @Param("user") String user, @Param("dateTime") String dateTime);
}
