package com.web.app.service.impl;

import com.web.app.dto.DocListResponse;
import com.web.app.entity.HdocDocumentList;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.UD20GetDocumentListService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UD20GetDocumentListServiceImpl implements UD20GetDocumentListService {

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    @Override
    public List<DocListResponse> selectHdocDocumentList(String doctype) {
        // 若指定了doctype则查询单条，否则返回全部
        if (doctype != null && !doctype.isEmpty()) {
            HdocDocumentList entity = hdocDocumentListMapper.selectByDoctype(doctype);
            if (entity == null) {
                return java.util.Collections.emptyList();
            }
            DocListResponse r = new DocListResponse();
            r.setDescription(entity.getDescription());
            r.setDoctype(entity.getDoctype());
            r.setRegisterUser(entity.getRegisterUser());
            r.setRegisterDatetime(entity.getRegisterDatetime() != null ? entity.getRegisterDatetime().toString() : null);
            return java.util.Collections.singletonList(r);
        }
        // 未指定doctype时返回全部（供pulldownlist使用）
        return hdocDocumentListMapper.selectAllDocumentList().stream()
            .map(d -> { DocListResponse r = new DocListResponse(); r.setDescription(d.getDescription()); r.setDoctype(d.getDoctype()); return r; })
            .collect(Collectors.toList());
    }
}
