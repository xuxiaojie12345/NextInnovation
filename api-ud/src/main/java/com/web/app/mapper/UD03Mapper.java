package com.web.app.mapper;

import com.web.app.domain.entity.DocumentType;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

/**
 * UD03数据访问层
 * 对应HDOC_DOCUMENT_LIST表
 */
@Mapper
public interface UD03Mapper {

    /**
     * 查询所有文档类型（全检索）
     * @return 文档类型列表
     */
    List<DocumentType> selectAllDocumentTypes();
}
