package com.web.app.service.impl;

import com.web.app.service.UD18HDocUserDocAdministrationService;
import com.web.app.dto.*;
import com.web.app.mapper.*;
import com.web.app.entity.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class UD18HDocUserDocAdministrationServiceImpl implements UD18HDocUserDocAdministrationService {

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;
    @Autowired
    private HdocUserDocMapper hdocUserDocMapper;

    @Override
    public UD18DocumentListResponse getDocumentList() {
        List<HdocDocumentList> list = hdocDocumentListMapper.selectAllDoctype();
        List<UD18DocumentListResponse.DocumentItem> items = new ArrayList<>();
        for (HdocDocumentList doc : list) {
            UD18DocumentListResponse.DocumentItem item = new UD18DocumentListResponse.DocumentItem();
            item.setDoctype(doc.getDoctype());
            item.setDescription(doc.getDescription());
            items.add(item);
        }
        return UD18DocumentListResponse.success(items);
    }

    @Override
    public UD18UserDocResponse selectUserDoc(UD18UserDocAdminRequest request) {
        if (request.getUserid() == null || request.getUserid().isEmpty()) {
            return UD18UserDocResponse.error("We didn't recognize the userid you entered. Please try again.");
        }
        List<HdocUserDoc> userDocs = hdocUserDocMapper.selectByUserid(request.getUserid());
        List<UD18DocumentListResponse.DocumentItem> items = new ArrayList<>();
        for (HdocUserDoc ud : userDocs) {
            HdocDocumentList doc = hdocDocumentListMapper.selectByDoctype(ud.getDoctype());
            if (doc != null) {
                UD18DocumentListResponse.DocumentItem item = new UD18DocumentListResponse.DocumentItem();
                item.setDoctype(doc.getDoctype());
                item.setDescription(doc.getDescription());
                items.add(item);
            }
        }
        UD18UserDocResponse res = new UD18UserDocResponse();
        UD18UserDocResponse.DataInfo data = new UD18UserDocResponse.DataInfo();
        data.setDocuments(items);
        res.setCode(200);
        res.setMsg("获取成功");
        res.setData(data);
        return res;
    }

    @Override
    public UD18UpdateUserDocResponse updateUserDoc(UD18UserDocAdminRequest request) {
        if (request.getUserid() == null || request.getUserid().isEmpty()) {
            return UD18UpdateUserDocResponse.error("We didn't recognize the userid you entered. Please try again.");
        }
        hdocUserDocMapper.deleteByUserid(request.getUserid());
        if (request.getDocuments() != null) {
            for (String doctype : request.getDocuments()) {
                HdocUserDoc ud = new HdocUserDoc();
                ud.setUserid(request.getUserid());
                ud.setDoctype(doctype);
                ud.setRegisterDatetime(new Date());
                ud.setUpdateDatetime(new Date());
                hdocUserDocMapper.insert(ud);
            }
        }
        return UD18UpdateUserDocResponse.success();
    }
}
