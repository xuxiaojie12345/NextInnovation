package com.web.app.service;

import com.web.app.domain.entity.DocumentType;
import java.util.List;

/**
 * UD03业务逻辑接口
 */
public interface UD03Service {

    /**
     * 查询所有文档类型（全检索HDOC_DOCUMENT_LIST表）
     * @return 文档类型列表
     */
    List<DocumentType> getAllDocumentTypes();
}
