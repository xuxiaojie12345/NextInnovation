package com.web.app.service.impl;

import com.web.app.dto.DocumentTypeListResponse;
import com.web.app.entity.HdocDocumentList;
import com.web.app.mapper.DocumentListMapper;
import com.web.app.service.DocumentListService;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DocumentListServiceImpl implements DocumentListService {

  @Autowired
  private DocumentListMapper documentListMapper;

  @Override
  public List<DocumentTypeListResponse> getHdocdocumentlist() {
    List<HdocDocumentList> entities = documentListMapper.findAllDocumentTypes();
    List<DocumentTypeListResponse> result = new ArrayList<>();
    for (HdocDocumentList entity : entities) {
      DocumentTypeListResponse item = new DocumentTypeListResponse();
      item.setDoctype(entity.getDoctype());
      item.setDescription(entity.getDescription());
      result.add(item);
    }
    return result;
  }
}
