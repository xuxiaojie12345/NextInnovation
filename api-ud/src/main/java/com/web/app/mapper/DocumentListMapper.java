package com.web.app.mapper;

import com.web.app.dto.DocumentTypeDto;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/**
 * Document list 数据访问层
 *
 * @description 查询 HDOC_DOCUMENT_LIST 表的文档类型信息
 */
@Mapper
public interface DocumentListMapper {

    /**
     * 查询所有 document type
     *
     * @return DocumentTypeDto 列表
     */
    List<DocumentTypeDto> selectDocumentTypes();
}
