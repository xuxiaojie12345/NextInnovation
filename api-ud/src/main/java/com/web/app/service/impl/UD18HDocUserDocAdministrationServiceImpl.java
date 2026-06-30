package com.web.app.service.impl;

import com.web.app.dto.DocListResponse;
import com.web.app.dto.DoctypeResponse;
import com.web.app.entity.HdocUserDoc;
import com.web.app.mapper.HdocFunctionAuthMapper;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.mapper.HdocUserDocMapper;
import com.web.app.service.UD18HDocUserDocAdministrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UD18HDocUserDocAdministrationServiceImpl implements UD18HDocUserDocAdministrationService {

    @Autowired
    private HdocFunctionAuthMapper hdocFunctionAuthMapper;
    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;
    @Autowired
    private HdocUserDocMapper hdocUserDocMapper;

    @Override
    public boolean selectHdocFunctionAuth(String userId) {
        return hdocFunctionAuthMapper.selectByUserId(userId) != null;
    }

    @Override
    public List<DocListResponse> getHdocDocumentList() {
        return hdocDocumentListMapper.selectAllDocumentList().stream()
            .map(d -> { DocListResponse r = new DocListResponse(); r.setDescription(d.getDescription()); return r; })
            .collect(Collectors.toList());
    }

    @Override
    public List<DoctypeResponse> selectHdocUserDoc(String userId) {
        return hdocUserDocMapper.selectByUserId(userId).stream()
            .map(d -> { DoctypeResponse r = new DoctypeResponse(); r.setDoctype(d.getDoctype()); return r; })
            .collect(Collectors.toList());
    }

    @Override
    public void deleteAllUserDocByUserId(String userId) {
        hdocUserDocMapper.deleteByUserId(userId);
    }

    @Override
    public void createHdocUserDoc(String userId, String doctype, String registerUser, String registerProcess) {
        HdocUserDoc record = new HdocUserDoc();
        record.setUserid(userId);
        record.setDoctype(doctype);
        record.setRegisterUser(registerUser);
        record.setRegisterDatetime(LocalDateTime.now());
        record.setRegisterProcess(registerProcess);
        record.setUpdateUser(registerUser);
        record.setUpdateDatetime(LocalDateTime.now());
        record.setUpdateProcess(registerProcess);
        hdocUserDocMapper.insertUserDoc(record);
    }
}
