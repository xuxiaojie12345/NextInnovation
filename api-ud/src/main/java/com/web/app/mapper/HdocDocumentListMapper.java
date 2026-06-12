package com.web.app.mapper;

import com.web.app.entity.HdocDocumentList;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

/**
 * 文档列表Mapper接口
 */
@Mapper
public interface HdocDocumentListMapper {
    
    /**
     * 查询所有文档类型
     */
    List<HdocDocumentList> selectAllDocumentTypes();
    
    /**
     * 根据文档类型查询
     */
    List<HdocDocumentList> selectByDocumentType(String documentType);
    
    /**
     * 更新文档信息
     */
    int updateDocument(HdocDocumentList document);
}
