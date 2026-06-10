package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/**
 * UD03 Hdoc Document List Mapper
 * 用于查询文档类型列表数据
 */
@Mapper
public interface HdocDocumentListMapper {
    
    /**
     * 查询所有文档类型
     * 
     * @return 文档类型列表
     */
    List<String> selectDoctypeList();
}
