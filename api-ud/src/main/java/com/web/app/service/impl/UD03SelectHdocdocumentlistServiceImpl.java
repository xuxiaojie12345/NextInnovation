package com.web.app.service.impl;

import com.web.app.service.UD03SelectHdocdocumentlistService;
import com.web.app.dto.DoctypeListResponse;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.entity.HdocDocumentList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class UD03SelectHdocdocumentlistServiceImpl implements UD03SelectHdocdocumentlistService {

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    @Override
    public DoctypeListResponse getDoctypeList() {
        List<HdocDocumentList> list = hdocDocumentListMapper.selectAllDoctype();
        List<DoctypeListResponse.DoctypeItem> items = new ArrayList<>();
        for (HdocDocumentList doc : list) {
            DoctypeListResponse.DoctypeItem item = new DoctypeListResponse.DoctypeItem();
            item.setDoctype(doc.getDoctype());
            items.add(item);
        }
        return DoctypeListResponse.success(items);
    }
}
