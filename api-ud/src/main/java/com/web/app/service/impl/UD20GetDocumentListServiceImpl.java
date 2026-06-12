package com.web.app.service.impl;

import com.web.app.service.UD20GetDocumentListService;
import com.web.app.dto.UD20GetDocumentListResponse;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.entity.HdocDocumentList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class UD20GetDocumentListServiceImpl implements UD20GetDocumentListService {

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    @Override
    public UD20GetDocumentListResponse selectHdocDocumentList() {
        List<HdocDocumentList> list = hdocDocumentListMapper.selectAllDoctype();
        List<UD20GetDocumentListResponse.DocumentInfo> documents = new ArrayList<>();
        for (HdocDocumentList doc : list) {
            UD20GetDocumentListResponse.DocumentInfo info = new UD20GetDocumentListResponse.DocumentInfo();
            info.setDoctype(doc.getDoctype());
            info.setRegisterUser(doc.getRegisterUser());
            info.setRegisterDatetime(doc.getRegisterDatetime() != null ? doc.getRegisterDatetime().toString() : "");
            documents.add(info);
        }
        return UD20GetDocumentListResponse.success(documents);
    }
}
