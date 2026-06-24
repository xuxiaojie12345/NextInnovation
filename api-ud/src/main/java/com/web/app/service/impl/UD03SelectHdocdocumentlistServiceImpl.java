package com.web.app.service.impl;

import com.web.app.dto.DocumentTypeDto;
import com.web.app.mapper.DocumentListMapper;
import com.web.app.service.UD03SelectHdocdocumentlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * UD03 Service实现 - 读取 HDOC_DOCUMENT_LIST 表数据
 */
@Service
public class UD03SelectHdocdocumentlistServiceImpl implements UD03SelectHdocdocumentlistService {

    @Autowired
    private DocumentListMapper documentListMapper;

    @Override
    public List<DocumentTypeDto> getDocumentTypes() {
        return documentListMapper.selectDocumentTypes()
                .stream()
                .map(item -> new DocumentTypeDto(item.getDoctype(), item.getDescription()))
                .collect(Collectors.toList());
    }
}
