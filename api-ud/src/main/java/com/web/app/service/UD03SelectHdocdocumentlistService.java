package com.web.app.service;

import com.web.app.dto.DocumentTypeDto;
import java.util.List;

/**
 * UD03 Service接口 - 获取HDOC_DOCUMENT_LIST表的DOCTYPE列表
 */
public interface UD03SelectHdocdocumentlistService {
    List<DocumentTypeDto> getDocumentTypes();
}
