package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import java.util.List;

/**
 * UD03 文档类型列表数据访问层
 * 
 * 功能说明：查询 HDOC_DOCUMENT_LIST 表获取文档类型列表
 * 
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-18
 */
@Mapper
public interface UD03SelectHdocdocumentlistMapper {

    /**
     * 查询所有文档类型
     * 对应设计文档 5.2 - 查询语句:
     * SELECT DOCTYPE FROM HDOC_DOCUMENT_LIST ORDER BY DOCTYPE
     * 
     * @return 文档类型列表（按DOCTYPE排序）
     */
    List<String> selectDoctypeList();
}
