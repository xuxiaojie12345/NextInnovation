package com.web.app.service.impl;

import com.web.app.entity.HdocDocumentList;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.UD03SelectHdocdocumentlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UD03SelectHdocdocumentlistServiceImpl implements UD03SelectHdocdocumentlistService {

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    @Override
    public List<HdocDocumentList> selectHdocDocumentList() {
        List<HdocDocumentList> list = hdocDocumentListMapper.selectAllDocumentList();
        if (list == null || list.isEmpty()) {
            throw new RuntimeException("数据获取失败，没有找到文档类型数据");
        }
        return list;
    }
}
