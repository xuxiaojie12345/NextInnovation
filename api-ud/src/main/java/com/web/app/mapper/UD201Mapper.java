package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * UD20-1数据访问层
 */
@Mapper
public interface UD201Mapper {

    /**
     * 根据doctype统计记录数（检查是否存在）
     */
    Integer countByDoctype(@Param("doctype") String doctype);

    /**
     * 更新HDOC_DOCUMENT_LIST表
     */
    int updateHdocDocumentList(@Param("doctype") String doctype,
                                @Param("updateUser") String updateUser,
                                @Param("updateDatetime") String updateDatetime);
}
