package com.web.app.service.impl;

import com.web.app.dto.response.DocumentListRecord;
import com.web.app.dto.response.DocumentTypeListResponse;
import com.web.app.entity.HdocDocumentList;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.DocumentListService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DocumentListServiceImpl implements DocumentListService {

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    @Override
    public DocumentTypeListResponse getDocumentTypes() {
        List<HdocDocumentList> list = hdocDocumentListMapper.selectAll();
        List<DocumentTypeListResponse.DocumentTypeItem> items = list.stream()
            .map(d -> new DocumentTypeListResponse.DocumentTypeItem(d.getDoctype(), d.getDescription()))
            .collect(Collectors.toList());
        return new DocumentTypeListResponse(items);
    }

    @Override
    public List<DocumentListRecord> getDocumentList() {
        List<HdocDocumentList> list = hdocDocumentListMapper.selectAll();
        return list.stream()
            .map(d -> new DocumentListRecord(d.getDoctype(), "BU", d.getRegisterUser(),
                d.getRegisterDatetime() != null ? d.getRegisterDatetime().toString() : null))
            .collect(Collectors.toList());
    }
}
